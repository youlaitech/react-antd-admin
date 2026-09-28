import { useState } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  type TableProps,
} from "antd";
import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import NoticeAPI from "@/api/system/notice";
import type { NoticeDetail, NoticeForm, NoticeItem, NoticeQueryParams } from "@/api/system/notice";
import UserAPI from "@/api/system/user";
import Auth from "@/components/Auth";
import RefreshButton from "@/components/RefreshButton";
import WangEditor from "@/components/WangEditor";
import { NoticePublishStatus, NoticeTargetType } from "@/enums";
import { useDict } from "@/hooks/useDict";
import { useTableQuery } from "@/hooks/useTableQuery";
import { toTagColor } from "@/utils/dict";
import { validateForm } from "@/utils/form";
import { isRichTextEmpty } from "@/utils/rich-text";

/** 发布状态对应的标签色 */
const PUBLISH_STATUS_TAG_COLOR: Record<number, string> = {
  [NoticePublishStatus.DRAFT]: "default",
  [NoticePublishStatus.PUBLISHED]: "success",
  [NoticePublishStatus.REVOKED]: "warning",
};

/** 发布状态对应的语言包 key */
const PUBLISH_STATUS_LABEL_KEY: Record<number, string> = {
  [NoticePublishStatus.DRAFT]: "system.notice.draft",
  [NoticePublishStatus.PUBLISHED]: "system.notice.published",
  [NoticePublishStatus.REVOKED]: "system.notice.revoked",
};

/** 通知公告，已发布的只能查看，需撤回后才可再次编辑 */
export default function NoticeList() {
  const { t } = useTranslation();
  const { message, modal } = AntdApp.useApp();

  const [searchForm] = Form.useForm<NoticeQueryParams>();
  const [editForm] = Form.useForm<NoticeForm>();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<NoticeDetail>();
  const [userOptions, setUserOptions] = useState<{ value: number; label: string }[]>([]);

  const noticeTypes = useDict("notice_type");
  const noticeLevels = useDict("notice_level");

  const targetType = Form.useWatch("targetType", editForm) ?? NoticeTargetType.ALL;

  const { loading, list, total, queryParams, setQueryParams, fetchList } = useTableQuery<
    NoticeItem,
    NoticeQueryParams
  >({ fetcher: NoticeAPI.getPage });

  function handleSearch() {
    setQueryParams((prev) => ({ ...prev, ...searchForm.getFieldsValue(), pageNum: 1 }));
  }

  function handleReset() {
    searchForm.resetFields();
    setQueryParams((prev) => ({ ...prev, title: undefined, publishStatus: undefined, pageNum: 1 }));
  }

  /** 加载指定用户下拉选项，仅在选择"指定用户"时才请求 */
  async function loadUserOptions() {
    if (userOptions.length > 0) return;
    const options = await UserAPI.getOptions();
    setUserOptions(
      options.map((item) => ({ value: Number(item.value), label: String(item.label) }))
    );
  }

  function openCreateModal() {
    setEditingId(undefined);
    editForm.resetFields();
    editForm.setFieldsValue({
      targetType: NoticeTargetType.ALL,
      level: "L",
      targetUsers: [],
    });
    setModalOpen(true);
  }

  async function openUpdateModal(id: string) {
    const data = await NoticeAPI.getFormData(id);
    setEditingId(id);

    if (data.targetType === NoticeTargetType.SPECIFIED) {
      await loadUserOptions();
    }

    editForm.setFieldsValue({ ...data, targetUsers: data.targetUsers ?? [] });
    setModalOpen(true);
  }

  async function handleSubmit() {
    const values = await validateForm(editForm);
    if (!values) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await NoticeAPI.update(editingId, values);
      } else {
        await NoticeAPI.create(values);
      }
      message.success(t("common.saveSuccess"));
      setModalOpen(false);
      fetchList();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(ids: string) {
    await NoticeAPI.deleteByIds(ids);
    message.success(t("common.deleteSuccess"));
    setSelectedIds([]);
    fetchList();
  }

  function handleBatchDelete() {
    if (selectedIds.length === 0) {
      message.warning(t("common.selectRequired"));
      return;
    }
    handleDelete(selectedIds.join(","));
  }

  /** 发布与撤回都会改变列表状态，统一走确认弹窗 */
  function handlePublishChange(id: string, publish: boolean) {
    modal.confirm({
      title: t("common.tips"),
      content: t(publish ? "system.notice.publishConfirm" : "system.notice.revokeConfirm"),
      onOk: async () => {
        await (publish ? NoticeAPI.publish(id) : NoticeAPI.revoke(id));
        message.success(t("common.saveSuccess"));
        fetchList();
      },
    });
  }

  async function openDetailModal(id: string) {
    const data = await NoticeAPI.getDetail(id);
    setDetail(data);
  }

  const columns: TableProps<NoticeItem>["columns"] = [
    { title: t("system.notice.title"), dataIndex: "title", minWidth: 200 },
    {
      title: t("system.notice.type"),
      dataIndex: "type",
      width: 140,
      render: (type: number) => {
        const matched = noticeTypes.find((item) => Number(item.value) === type);
        return matched ? <Tag color={toTagColor(matched.tagType)}>{matched.label}</Tag> : type;
      },
    },
    { title: t("system.notice.publisher"), dataIndex: "publisherName", width: 120 },
    {
      title: t("system.notice.level"),
      dataIndex: "level",
      width: 100,
      render: (level: string) => {
        const matched = noticeLevels.find((item) => String(item.value) === level);
        return matched ? <Tag color={toTagColor(matched.tagType)}>{matched.label}</Tag> : level;
      },
    },
    {
      title: t("system.notice.publishStatus"),
      dataIndex: "publishStatus",
      width: 110,
      render: (status: number) => (
        <Tag color={PUBLISH_STATUS_TAG_COLOR[status] ?? "default"}>
          {t(PUBLISH_STATUS_LABEL_KEY[status] ?? "system.notice.draft")}
        </Tag>
      ),
    },
    { title: t("system.notice.createTime"), dataIndex: "createTime", width: 180 },
    {
      title: t("common.operate"),
      key: "operate",
      width: 240,
      fixed: "right",
      render: (_, record) => {
        const published = record.publishStatus === NoticePublishStatus.PUBLISHED;

        return (
          <Space size={0}>
            <Button type="link" size="small" onClick={() => openDetailModal(record.id)}>
              {t("system.notice.view")}
            </Button>
            <Auth perm={published ? "sys:notice:revoke" : "sys:notice:publish"}>
              <Button
                type="link"
                size="small"
                onClick={() => handlePublishChange(record.id, !published)}
              >
                {t(published ? "system.notice.revoke" : "system.notice.publish")}
              </Button>
            </Auth>
            {!published && (
              <>
                <Auth perm="sys:notice:update">
                  <Button type="link" size="small" onClick={() => openUpdateModal(record.id)}>
                    {t("common.update")}
                  </Button>
                </Auth>
                <Auth perm="sys:notice:delete">
                  <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>
                    {t("common.delete")}
                  </Button>
                </Auth>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <Card className="page-search">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="title">
            <Input placeholder={t("system.notice.title")} allowClear className="w-200px" />
          </Form.Item>
          <Form.Item name="publishStatus">
            <Select
              allowClear
              className="w-140px"
              placeholder={t("system.notice.publishStatus")}
              options={[
                { value: NoticePublishStatus.DRAFT, label: t("system.notice.draft") },
                { value: NoticePublishStatus.PUBLISHED, label: t("system.notice.published") },
                { value: NoticePublishStatus.REVOKED, label: t("system.notice.revoked") },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                {t("common.search")}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                {t("common.reset")}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card className="page-content">
        <div className="page-toolbar">
          <Space>
            <Auth perm="sys:notice:create">
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                {t("common.create")}
              </Button>
            </Auth>
            <Auth perm="sys:notice:delete">
              <Button danger disabled={selectedIds.length === 0} onClick={handleBatchDelete}>
                {t("common.delete")}
              </Button>
            </Auth>
          </Space>

          <RefreshButton onClick={fetchList} loading={loading} />
        </div>

        <Table<NoticeItem>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          scroll={{ x: 1300 }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys.map(String)),
          }}
          pagination={{
            current: queryParams.pageNum,
            pageSize: queryParams.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (count) => t("common.total", { total: count }),
            onChange: (pageNum, pageSize) =>
              setQueryParams((prev) => ({ ...prev, pageNum, pageSize })),
          }}
        />
      </Card>

      <Modal
        title={editingId ? t("common.update") : t("common.create")}
        open={modalOpen}
        width={820}
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={editForm} labelCol={{ span: 4 }} wrapperCol={{ span: 19 }} className="pt-4">
          <Form.Item
            name="title"
            label={t("system.notice.title")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="type"
            label={t("system.notice.type")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Select
              options={noticeTypes.map((item) => ({
                value: Number(item.value),
                label: item.label,
              }))}
            />
          </Form.Item>

          <Form.Item name="level" label={t("system.notice.level")}>
            <Select
              options={noticeLevels.map((item) => ({
                value: String(item.value),
                label: item.label,
              }))}
            />
          </Form.Item>

          <Form.Item name="targetType" label={t("system.notice.targetType")}>
            <Radio.Group
              onChange={(event) => {
                if (event.target.value === NoticeTargetType.SPECIFIED) {
                  loadUserOptions();
                }
              }}
            >
              <Radio value={NoticeTargetType.ALL}>{t("system.notice.targetAll")}</Radio>
              <Radio value={NoticeTargetType.SPECIFIED}>{t("system.notice.targetSpecified")}</Radio>
            </Radio.Group>
          </Form.Item>

          {targetType === NoticeTargetType.SPECIFIED && (
            <Form.Item
              name="targetUsers"
              label={t("system.notice.targetUsers")}
              rules={[{ required: true, message: t("common.required") }]}
            >
              <Select mode="multiple" showSearch optionFilterProp="label" options={userOptions} />
            </Form.Item>
          )}

          <Form.Item
            name="content"
            label={t("system.notice.content")}
            rules={[
              {
                // 富文本清空后是 <p><br></p>，用 required 判不出空，这里按实际内容校验
                validator: (_, value: string) =>
                  isRichTextEmpty(value)
                    ? Promise.reject(new Error(t("common.required")))
                    : Promise.resolve(),
              },
            ]}
          >
            <WangEditor height="300px" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t("system.notice.view")}
        open={!!detail}
        footer={null}
        width={720}
        onCancel={() => setDetail(undefined)}
      >
        <Descriptions column={1} bordered size="small" className="mt-4">
          <Descriptions.Item label={t("system.notice.title")}>{detail?.title}</Descriptions.Item>
          <Descriptions.Item label={t("system.notice.publishStatus")}>
            <Tag color={PUBLISH_STATUS_TAG_COLOR[detail?.publishStatus ?? 0] ?? "default"}>
              {t(PUBLISH_STATUS_LABEL_KEY[detail?.publishStatus ?? 0] ?? "system.notice.draft")}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t("system.notice.publisher")}>
            {detail?.publisherName}
          </Descriptions.Item>
          <Descriptions.Item label={t("system.notice.publishTime")}>
            {detail?.publishTime}
          </Descriptions.Item>
          <Descriptions.Item label={t("system.notice.content")}>
            {/* 通知内容是后端存的富文本，这里按 HTML 渲染 */}
            <div
              className="rich-text"
              dangerouslySetInnerHTML={{ __html: detail?.content ?? "" }}
            />
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  );
}

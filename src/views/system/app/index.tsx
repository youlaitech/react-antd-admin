import { useState } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  type TableProps,
} from "antd";
import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import AppAPI from "@/api/system/app";
import type { AppForm, AppItem, AppPlatform, AppQueryParams } from "@/api/system/app";
import Auth from "@/components/Auth";
import RefreshButton from "@/components/RefreshButton";
import { CommonStatus } from "@/enums";
import { useTableQuery } from "@/hooks/useTableQuery";
import { validateForm } from "@/utils/form";

/** 三方平台选项 */
const PLATFORM_OPTIONS: Array<{ value: AppPlatform; labelKey: string }> = [
  { value: "WECHAT_MP", labelKey: "system.app.platformWechatMp" },
  { value: "WECHAT_MINI", labelKey: "system.app.platformWechatMini" },
  { value: "ALIPAY", labelKey: "system.app.platformAlipay" },
  { value: "APPLE", labelKey: "system.app.platformApple" },
  { value: "QQ", labelKey: "system.app.platformQq" },
];

/** 新增应用时的表单初始值 */
const INITIAL_FORM_DATA: AppForm = {
  appName: "",
  appCode: "",
  platform: "WECHAT_MINI",
  appId: "",
  appSecret: "",
  merchantId: "",
  merchantKey: "",
  status: CommonStatus.ENABLED,
  remark: "",
};

/** 应用管理 */
export default function AppList() {
  const { t } = useTranslation();
  const { message, modal } = AntdApp.useApp();

  const [searchForm] = Form.useForm<AppQueryParams>();
  const [editForm] = Form.useForm<AppForm>();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const { loading, list, total, queryParams, setQueryParams, fetchList } = useTableQuery<
    AppItem,
    AppQueryParams
  >({ fetcher: AppAPI.getPage });

  function handleSearch() {
    setQueryParams((prev) => ({ ...prev, ...searchForm.getFieldsValue(), pageNum: 1 }));
  }

  function handleReset() {
    searchForm.resetFields();
    setQueryParams((prev) => ({
      ...prev,
      keywords: undefined,
      platform: undefined,
      status: undefined,
      pageNum: 1,
    }));
  }

  function openCreateModal() {
    setEditingId(undefined);
    editForm.resetFields();
    editForm.setFieldsValue(INITIAL_FORM_DATA);
    setModalOpen(true);
  }

  async function openUpdateModal(id: string) {
    const data = await AppAPI.getFormData(id);
    setEditingId(id);
    editForm.resetFields();
    editForm.setFieldsValue(data);
    setModalOpen(true);
  }

  async function handleSubmit() {
    const values = await validateForm(editForm);
    if (!values) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await AppAPI.update(editingId, values);
      } else {
        await AppAPI.create(values);
      }
      message.success(t("common.saveSuccess"));
      setModalOpen(false);
      fetchList();
    } finally {
      setSubmitting(false);
    }
  }

  /** 切换应用状态，失败时把开关拨回原状态 */
  async function handleStatusChange(record: AppItem, status: number) {
    try {
      await AppAPI.updateStatus(record.id as string, status);
      message.success(t("system.app.statusUpdated"));
      fetchList();
    } catch {
      // 提示已由响应拦截器给出，这里只需让列表回到真实状态
      fetchList();
    }
  }

  function handleDelete(ids: string) {
    modal.confirm({
      title: t("common.tips"),
      content: t("common.deleteConfirm"),
      okButtonProps: { danger: true },
      onOk: async () => {
        await AppAPI.deleteByIds(ids);
        message.success(t("common.deleteSuccess"));
        setSelectedIds([]);
        fetchList();
      },
    });
  }

  function handleBatchDelete() {
    if (selectedIds.length === 0) {
      message.warning(t("common.selectRequired"));
      return;
    }
    handleDelete(selectedIds.join(","));
  }

  /** 平台值转展示名称 */
  function resolvePlatformLabel(platform?: string) {
    const matched = PLATFORM_OPTIONS.find((item) => item.value === platform);
    return matched ? t(matched.labelKey) : "-";
  }

  const columns: TableProps<AppItem>["columns"] = [
    {
      title: t("common.index"),
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    { title: t("system.app.appName"), dataIndex: "appName", minWidth: 140 },
    { title: t("system.app.appCode"), dataIndex: "appCode", minWidth: 120 },
    {
      title: t("system.app.platform"),
      dataIndex: "platform",
      width: 130,
      render: (platform: string) => <Tag>{resolvePlatformLabel(platform)}</Tag>,
    },
    { title: t("system.app.appId"), dataIndex: "appId", minWidth: 160 },
    {
      title: t("common.status"),
      dataIndex: "status",
      width: 90,
      render: (status: number, record) => (
        <Auth perm="sys:app:change-status" fallback={<span />}>
          <Switch
            size="small"
            checked={status === CommonStatus.ENABLED}
            checkedChildren={t("common.enabled")}
            unCheckedChildren={t("common.disabled")}
            onChange={(checked) =>
              handleStatusChange(record, checked ? CommonStatus.ENABLED : CommonStatus.DISABLED)
            }
          />
        </Auth>
      ),
    },
    { title: t("common.remark"), dataIndex: "remark", minWidth: 160, ellipsis: true },
    { title: t("common.createTime"), dataIndex: "createTime", width: 180 },
    {
      title: t("common.operate"),
      key: "operate",
      width: 160,
      fixed: "right",
      render: (_, record) => (
        <Space size={0}>
          <Auth perm="sys:app:update">
            <Button
              type="link"
              size="small"
              onClick={() => record.id && openUpdateModal(record.id)}
            >
              {t("common.update")}
            </Button>
          </Auth>
          <Auth perm="sys:app:delete">
            <Button
              type="link"
              size="small"
              danger
              onClick={() => record.id && handleDelete(record.id)}
            >
              {t("common.delete")}
            </Button>
          </Auth>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card className="page-search">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keywords" label={t("common.keyword")}>
            <Input placeholder={t("system.app.keyword")} allowClear className="w-220px" />
          </Form.Item>
          <Form.Item name="platform" label={t("system.app.platform")}>
            <Select
              allowClear
              placeholder={t("system.app.all")}
              className="w-140px"
              options={PLATFORM_OPTIONS.map((item) => ({
                value: item.value,
                label: t(item.labelKey),
              }))}
            />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}>
            <Select
              allowClear
              placeholder={t("system.app.all")}
              className="w-120px"
              options={[
                { value: CommonStatus.ENABLED, label: t("system.app.statusNormal") },
                { value: CommonStatus.DISABLED, label: t("common.disabled") },
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
            <Auth perm="sys:app:create">
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                {t("common.create")}
              </Button>
            </Auth>
            <Auth perm="sys:app:delete">
              <Button danger disabled={selectedIds.length === 0} onClick={handleBatchDelete}>
                {t("common.delete")}
              </Button>
            </Auth>
          </Space>

          <RefreshButton onClick={fetchList} loading={loading} />
        </div>

        <Table<AppItem>
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
        title={editingId ? t("system.app.editTitle") : t("system.app.createTitle")}
        width={640}
        open={modalOpen}
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={editForm} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} className="pt-4">
          <Form.Item
            name="appName"
            label={t("system.app.appName")}
            rules={[{ required: true, message: t("system.app.appNameRequired") }]}
          >
            <Input maxLength={100} placeholder={t("system.app.appNamePlaceholder")} />
          </Form.Item>
          <Form.Item
            name="appCode"
            label={t("system.app.appCode")}
            rules={[{ required: true, message: t("system.app.appCodeRequired") }]}
          >
            <Input maxLength={100} placeholder={t("system.app.appCodePlaceholder")} />
          </Form.Item>
          <Form.Item
            name="platform"
            label={t("system.app.platform")}
            rules={[{ required: true, message: t("system.app.platformRequired") }]}
          >
            <Select
              placeholder={t("system.app.platformPlaceholder")}
              options={PLATFORM_OPTIONS.map((item) => ({
                value: item.value,
                label: t(item.labelKey),
              }))}
            />
          </Form.Item>
          <Form.Item
            name="appId"
            label={t("system.app.appId")}
            rules={[{ required: true, message: t("system.app.appIdRequired") }]}
          >
            <Input maxLength={64} placeholder={t("system.app.appIdPlaceholder")} />
          </Form.Item>
          <Form.Item name="appSecret" label={t("system.app.appSecret")}>
            <Input.Password maxLength={256} placeholder={t("system.app.optionalPlaceholder")} />
          </Form.Item>
          <Form.Item name="merchantId" label={t("system.app.merchantId")}>
            <Input maxLength={64} placeholder={t("system.app.optionalPlaceholder")} />
          </Form.Item>
          <Form.Item name="merchantKey" label={t("system.app.merchantKey")}>
            <Input.Password maxLength={512} placeholder={t("system.app.optionalPlaceholder")} />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}>
            <Radio.Group>
              <Radio value={CommonStatus.ENABLED}>{t("system.app.statusNormal")}</Radio>
              <Radio value={CommonStatus.DISABLED}>{t("common.disabled")}</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="remark" label={t("common.remark")}>
            <Input.TextArea
              rows={3}
              maxLength={255}
              showCount
              placeholder={t("system.app.optionalPlaceholder")}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

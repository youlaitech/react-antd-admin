import { useCallback, useState } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  type TableProps,
} from "antd";
import {
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import DictAPI from "@/api/system/dict";
import type { DictItem, DictItemForm, DictItemQueryParams, DictTagType } from "@/api/system/dict";
import Auth from "@/components/Auth";
import StatusDot from "@/components/StatusDot";
import RefreshButton from "@/components/RefreshButton";
import { CommonStatus } from "@/enums";
import { invalidateDict } from "@/hooks/useDict";
import { useTableQuery } from "@/hooks/useTableQuery";
import { toTagColor } from "@/utils/dict";
import { validateForm } from "@/utils/form";

/**
 * 可选的标签样式，空值表示不套样式
 */
const TAG_TYPE_OPTIONS: Exclude<DictTagType, "">[] = [
  "primary",
  "success",
  "info",
  "warning",
  "danger",
];

interface DictItemPanelProps {
  /** 当前字典编码 */
  dictCode: string;
  /** 当前字典名称 */
  dictName?: string;
}

/**
 * 字典项面板
 */
export default function DictItemPanel({ dictCode, dictName }: DictItemPanelProps) {
  const { t } = useTranslation();
  const { message, modal } = AntdApp.useApp();

  const [searchForm] = Form.useForm<DictItemQueryParams>();
  const [editForm] = Form.useForm<DictItemForm>();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  // 查询条件里带了字典编码，fetcher 依赖它，必须保持引用稳定否则会反复请求
  const fetcher = useCallback(
    (params: DictItemQueryParams) => DictAPI.getDictItemPage(dictCode, params),
    [dictCode],
  );

  const { loading, list, total, queryParams, setQueryParams, fetchList } = useTableQuery<
    DictItem,
    DictItemQueryParams
  >({ fetcher, defaultParams: { dictCode, keywords: "" } });

  function handleSearch() {
    setQueryParams((prev) => ({ ...prev, ...searchForm.getFieldsValue(), pageNum: 1 }));
  }

  function handleReset() {
    searchForm.resetFields();
    setQueryParams((prev) => ({ ...prev, keywords: undefined, pageNum: 1 }));
  }

  function openCreateModal() {
    setEditingId(undefined);
    editForm.resetFields();
    editForm.setFieldsValue({ dictCode, sort: 1, status: CommonStatus.ENABLED, tagType: "" });
    setModalOpen(true);
  }

  async function openUpdateModal(id: string) {
    const data = await DictAPI.getDictItemFormData(dictCode, id);
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
        await DictAPI.updateDictItem(dictCode, editingId, { ...values, dictCode });
      } else {
        await DictAPI.createDictItem(dictCode, { ...values, dictCode });
      }
      message.success(t("common.saveSuccess"));
      setModalOpen(false);
      invalidateDict(dictCode);
      fetchList();
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * 删除单个或批量字典项
   */
  async function handleDelete(ids: string) {
    await DictAPI.deleteDictItems(dictCode, ids);
    message.success(t("common.deleteSuccess"));
    setSelectedIds([]);
    invalidateDict(dictCode);
    fetchList();
  }

  function handleBatchDelete() {
    if (selectedIds.length === 0) {
      message.warning(t("common.selectRequired"));
      return;
    }

    modal.confirm({
      title: t("common.tips"),
      content: t("system.dict.deleteItemConfirm"),
      okButtonProps: { danger: true },
      onOk: () => handleDelete(selectedIds.join(",")),
    });
  }

  /**
   * 标签样式的预览，让用户在保存前就看到最终效果
   */
  function renderTagPreview(tagType: DictTagType, label: string) {
    return tagType ? <Tag color={toTagColor(tagType)}>{label}</Tag> : <span>{label}</span>;
  }

  const columns: TableProps<DictItem>["columns"] = [
    { title: t("system.dict.itemLabel"), dataIndex: "label", ellipsis: true },
    { title: t("system.dict.itemValue"), dataIndex: "value", ellipsis: true },
    {
      title: t("system.dict.tagType"),
      dataIndex: "tagType",
      width: 130,
      render: (tagType: DictTagType, record) =>
        tagType ? (
          <Tag color={toTagColor(tagType)}>{record.label}</Tag>
        ) : (
          <span className="dict-item-panel__plain">{t("system.dict.itemPlain")}</span>
        ),
    },
    { title: t("common.sort"), dataIndex: "sort", width: 80 },
    {
      title: t("common.status"),
      dataIndex: "status",
      width: 100,
      render: (status: number) => (
        <span className="dict-item-panel__status">
          <StatusDot active={status === CommonStatus.ENABLED} />
          {status === CommonStatus.ENABLED ? t("common.enabled") : t("common.disabled")}
        </span>
      ),
    },
    {
      title: t("common.operate"),
      key: "operate",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Space size={0}>
          <Auth perm="sys:dict-item:update">
            <Button
              type="link"
              size="small"
              onClick={() => record.id && openUpdateModal(record.id)}
            >
              {t("common.update")}
            </Button>
          </Auth>
          <Auth perm="sys:dict-item:delete">
            <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>
              {t("common.delete")}
            </Button>
          </Auth>
        </Space>
      ),
    },
  ];

  return (
    <Card className="page-content">
      <div className="page-toolbar">
        <Space>
          {dictName && <span className="dict-item-panel__title">{dictName}</span>}
          <Form form={searchForm} layout="inline" onFinish={handleSearch}>
            <Form.Item name="keywords">
              <Input
                placeholder={t("system.dict.itemKeyword")}
                allowClear
                className="w-200px"
                onPressEnter={handleSearch}
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
        </Space>

        <Space>
          <Auth perm="sys:dict-item:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              {t("common.create")}
            </Button>
          </Auth>
          <Auth perm="sys:dict-item:delete">
            <Button danger disabled={selectedIds.length === 0} onClick={handleBatchDelete}>
              {t("common.delete")}
            </Button>
          </Auth>
          <RefreshButton onClick={fetchList} loading={loading} />
        </Space>
      </div>

      <Table<DictItem>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={list}
        scroll={{ x: 800 }}
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

      <Modal
        title={editingId ? t("system.dict.itemEdit") : t("system.dict.itemCreate")}
        open={modalOpen}
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={editForm} labelCol={{ span: 6 }} wrapperCol={{ span: 17 }} className="pt-4">
          <Form.Item
            name="label"
            label={t("system.dict.itemLabel")}
            rules={[{ required: true, message: t("system.dict.itemLabelRequired") }]}
          >
            <Input placeholder={t("system.dict.itemLabelPlaceholder")} />
          </Form.Item>
          <Form.Item
            name="value"
            label={t("system.dict.itemValue")}
            rules={[{ required: true, message: t("system.dict.itemValueRequired") }]}
          >
            <Input placeholder={t("system.dict.itemValuePlaceholder")} />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}>
            <Radio.Group>
              <Radio value={CommonStatus.ENABLED}>{t("common.enabled")}</Radio>
              <Radio value={CommonStatus.DISABLED}>{t("common.disabled")}</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="sort" label={t("common.sort")}>
            <InputNumber className="w-full" />
          </Form.Item>
          <Form.Item
            name="tagType"
            label={
              <span className="menu-form__label">
                {t("system.dict.tagType")}
                <Tooltip title={t("system.dict.tagTypeTip")}>
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <Select
              allowClear
              placeholder={t("system.dict.tagTypePlaceholder")}
              onClear={() => editForm.setFieldValue("tagType", "")}
              options={TAG_TYPE_OPTIONS.map((tagType) => ({
                value: tagType,
                label: renderTagPreview(tagType, t("system.dict.itemLabel")),
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

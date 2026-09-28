import { useState } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tooltip,
  type TableProps,
} from "antd";
import { PlusOutlined, ReloadOutlined, SearchOutlined, SyncOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import ConfigAPI from "@/api/system/config";
import type { ConfigForm, ConfigItem, ConfigQueryParams } from "@/api/system/config";
import Auth from "@/components/Auth";
import { useTableQuery } from "@/hooks/useTableQuery";
import { validateForm } from "@/utils/form";

/** 系统配置 */
export default function ConfigList() {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();

  const [searchForm] = Form.useForm<ConfigQueryParams>();
  const [editForm] = Form.useForm<ConfigForm>();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { loading, list, total, queryParams, setQueryParams, fetchList } = useTableQuery<
    ConfigItem,
    ConfigQueryParams
  >({ fetcher: ConfigAPI.getPage });

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
    setModalOpen(true);
  }

  async function openUpdateModal(id: string) {
    const data = await ConfigAPI.getFormData(id);
    setEditingId(id);
    editForm.setFieldsValue(data);
    setModalOpen(true);
  }

  async function handleSubmit() {
    const values = await validateForm(editForm);
    if (!values) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await ConfigAPI.update(editingId, values);
      } else {
        await ConfigAPI.create(values);
      }
      message.success(t("common.saveSuccess"));
      setModalOpen(false);
      fetchList();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await ConfigAPI.deleteById(id);
    message.success(t("common.deleteSuccess"));
    fetchList();
  }

  /** 刷新缓存 */
  async function handleRefreshCache() {
    setRefreshing(true);
    try {
      await ConfigAPI.refreshCache();
      message.success(t("system.config.refreshSuccess"));
    } finally {
      setRefreshing(false);
    }
  }

  const columns: TableProps<ConfigItem>["columns"] = [
    { title: t("system.config.configName"), dataIndex: "configName", minWidth: 120 },
    { title: t("system.config.configKey"), dataIndex: "configKey", minWidth: 120 },
    { title: t("system.config.configValue"), dataIndex: "configValue", minWidth: 120 },
    { title: t("common.remark"), dataIndex: "remark", minWidth: 120 },
    {
      title: t("common.operate"),
      key: "operate",
      width: 160,
      render: (_, record) => (
        <Space size={0}>
          <Auth perm="sys:config:update">
            <Button
              type="link"
              size="small"
              onClick={() => record.id && openUpdateModal(record.id)}
            >
              {t("common.update")}
            </Button>
          </Auth>
          <Auth perm="sys:config:delete">
            <Popconfirm
              title={t("common.deleteConfirm")}
              onConfirm={() => record.id && handleDelete(record.id)}
            >
              <Button type="link" size="small" danger>
                {t("common.delete")}
              </Button>
            </Popconfirm>
          </Auth>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card className="page-search">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keywords">
            <Input placeholder={t("system.config.keyword")} allowClear className="w-240px" />
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
            <Auth perm="sys:config:create">
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                {t("common.create")}
              </Button>
            </Auth>
          </Space>

          <Space>
            <Auth perm="sys:config:refresh">
              <Tooltip title={t("system.config.refreshCache")}>
                <Button icon={<SyncOutlined />} loading={refreshing} onClick={handleRefreshCache} />
              </Tooltip>
            </Auth>
          </Space>
        </div>

        <Table<ConfigItem>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          scroll={{ x: 900 }}
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
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={editForm} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} className="pt-4">
          <Form.Item
            name="configName"
            label={t("system.config.configName")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item
            name="configKey"
            label={t("system.config.configKey")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item
            name="configValue"
            label={t("system.config.configValue")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="remark" label={t("common.remark")}>
            <Input.TextArea rows={4} maxLength={100} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

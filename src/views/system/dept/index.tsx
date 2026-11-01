import { useEffect, useMemo, useState } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  TreeSelect,
  type TableProps,
} from "antd";
import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import DeptAPI from "@/api/system/dept";
import type { DeptForm, DeptItem, DeptQueryParams } from "@/api/system/dept";
import Auth from "@/components/Auth";
import RefreshButton from "@/components/RefreshButton";
import { CommonStatus } from "@/enums";
import { validateForm } from "@/utils/form";

// 顶级部门的选项值，后端约定 0 表示顶级
const ROOT_PARENT_ID = "0";

/**
 * 树形选项节点
 */
interface TreeOption {
  value: string;
  label: string;
  children?: TreeOption[];
}

/**
 * 部门列表转树形选择器数据
 */
function toTreeData(items: DeptItem[]): TreeOption[] {
  return items.map((item) => ({
    value: item.id ?? "",
    label: item.name ?? "",
    children: item.children?.length ? toTreeData(item.children) : undefined,
  }));
}

/**
 * 部门管理
 */
export default function DeptList() {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();

  const [searchForm] = Form.useForm<DeptQueryParams>();
  const [editForm] = Form.useForm<DeptForm>();

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<DeptItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function fetchList(params?: DeptQueryParams) {
    setLoading(true);
    try {
      const data = await DeptAPI.getList(params);
      setList(data ?? []);
    } catch (error) {
      // 提示已由响应拦截器给出，这里只记录日志
      console.warn(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  // 上级部门选项，外层补一个顶级部门
  const parentTreeData = useMemo(
    () => [{ value: ROOT_PARENT_ID, label: t("system.dept.root"), children: toTreeData(list) }],
    [list, t],
  );

  function handleSearch() {
    fetchList({ ...searchForm.getFieldsValue() });
  }

  function handleReset() {
    searchForm.resetFields();
    fetchList();
  }

  /**
   * 打开表单弹窗
   * @param parentId 上级部门，新增子部门时传入当前行
   * @param id 部门ID，有值表示编辑
   */
  async function openModal(parentId: string, id?: string) {
    setEditingId(id);
    editForm.resetFields();

    if (id) {
      const data = await DeptAPI.getFormData(id);
      editForm.setFieldsValue(data);
    } else {
      editForm.setFieldsValue({ parentId, sort: 1, status: CommonStatus.ENABLED });
    }

    setModalOpen(true);
  }

  async function handleSubmit() {
    const values = await validateForm(editForm);
    if (!values) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await DeptAPI.update(editingId, values);
      } else {
        await DeptAPI.create(values);
      }
      message.success(t("common.saveSuccess"));
      setModalOpen(false);
      fetchList();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(ids: string) {
    await DeptAPI.deleteByIds(ids);
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

  const columns: TableProps<DeptItem>["columns"] = [
    { title: t("system.dept.name"), dataIndex: "name", minWidth: 200 },
    { title: t("system.dept.code"), dataIndex: "code", width: 200 },
    {
      title: t("common.status"),
      dataIndex: "status",
      width: 100,
      render: (status: number) =>
        status === CommonStatus.ENABLED ? (
          <Tag color="success">{t("common.enabled")}</Tag>
        ) : (
          <Tag color="error">{t("common.disabled")}</Tag>
        ),
    },
    { title: t("common.sort"), dataIndex: "sort", width: 100 },
    {
      title: t("common.operate"),
      key: "operate",
      width: 200,
      render: (_, record) => (
        <Space size={0}>
          <Auth perm="sys:dept:create">
            <Button type="link" size="small" onClick={() => openModal(record.id ?? ROOT_PARENT_ID)}>
              {t("common.create")}
            </Button>
          </Auth>
          <Auth perm="sys:dept:update">
            <Button
              type="link"
              size="small"
              onClick={() => openModal(record.parentId ?? ROOT_PARENT_ID, record.id)}
            >
              {t("common.update")}
            </Button>
          </Auth>
          <Auth perm="sys:dept:delete">
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
            <Input placeholder={t("system.dept.name")} allowClear className="w-200px" />
          </Form.Item>
          <Form.Item name="status">
            {/* 状态筛选用下拉，分段按钮在搜索栏里占宽且视觉过重 */}
            <Select
              allowClear
              className="w-120px"
              placeholder={t("common.status")}
              options={[
                { value: CommonStatus.ENABLED, label: t("common.enabled") },
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
            <Auth perm="sys:dept:create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal(ROOT_PARENT_ID)}
              >
                {t("common.create")}
              </Button>
            </Auth>
            <Auth perm="sys:dept:delete">
              <Button danger disabled={selectedIds.length === 0} onClick={handleBatchDelete}>
                {t("common.delete")}
              </Button>
            </Auth>
          </Space>

          <RefreshButton onClick={() => fetchList()} loading={loading} />
        </div>

        <Table<DeptItem>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          defaultExpandAllRows
          scroll={{ x: 900 }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys.map(String)),
          }}
          pagination={false}
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
            name="parentId"
            label={t("system.dept.parent")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <TreeSelect
              treeData={parentTreeData}
              treeDefaultExpandAll
              showSearch
              treeNodeFilterProp="label"
              placeholder={t("system.dept.parentPlaceholder")}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label={t("system.dept.name")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label={t("system.dept.code")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="sort"
            label={t("common.sort")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}>
            <Radio.Group>
              <Radio value={CommonStatus.ENABLED}>{t("common.enabled")}</Radio>
              <Radio value={CommonStatus.DISABLED}>{t("common.disabled")}</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

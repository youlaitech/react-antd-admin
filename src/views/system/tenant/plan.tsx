import { useEffect, useMemo, useState } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Checkbox,
  Drawer,
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
  Tree,
  type TableProps,
} from "antd";
import {
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import MenuAPI from "@/api/system/menu";
import TenantPlanAPI from "@/api/system/tenant-plan";
import type {
  TenantPlanForm,
  TenantPlanItem,
  TenantPlanQueryParams,
} from "@/api/system/tenant-plan";
import type { OptionItem } from "@/api/common";
import Auth from "@/components/Auth";
import RefreshButton from "@/components/RefreshButton";
import { CommonStatus, MenuScope } from "@/enums";
import { useTableQuery } from "@/hooks/useTableQuery";
import { validateForm } from "@/utils/form";

/** 新增套餐时的表单初始值 */
const INITIAL_FORM_DATA: TenantPlanForm = {
  name: "",
  code: "",
  status: CommonStatus.ENABLED,
  sort: 1,
  remark: "",
};

/** 树节点数据 */
interface PlanTreeNode {
  key: string;
  title: string;
  children?: PlanTreeNode[];
}

/**
 * 菜单选项树转 antd Tree 数据
 */
function toTreeData(options: OptionItem[]): PlanTreeNode[] {
  return options.map((option) => ({
    key: String(option.value),
    title: option.label,
    children: option.children?.length ? toTreeData(option.children) : undefined,
  }));
}

/**
 * 收集树里的全部节点 key，用于「展开全部」
 */
function collectKeys(nodes: PlanTreeNode[]): string[] {
  return nodes.flatMap((node) => [node.key, ...(node.children ? collectKeys(node.children) : [])]);
}

/** 取出勾选集合里的叶子节点 */
function toLeafKeys(options: OptionItem[], menuIds: number[]): string[] {
  const idSet = new Set(menuIds.map(String));
  const leaves: string[] = [];

  const walk = (nodes: OptionItem[]) =>
    nodes.forEach((node) => {
      if (node.children?.length) {
        walk(node.children);
        return;
      }
      if (idSet.has(String(node.value))) leaves.push(String(node.value));
    });

  walk(options);
  return leaves;
}

/** 租户套餐管理 */
export default function TenantPlanList() {
  const { t } = useTranslation();
  const { message, modal } = AntdApp.useApp();

  const [searchForm] = Form.useForm<TenantPlanQueryParams>();
  const [planForm] = Form.useForm<TenantPlanForm>();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number>();
  const [submitting, setSubmitting] = useState(false);

  // 菜单配置抽屉
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [checkedPlan, setCheckedPlan] = useState<{ id?: number; name?: string }>({});
  const [menuPermOptions, setMenuPermOptions] = useState<OptionItem[]>([]);
  const [menuKeyword, setMenuKeyword] = useState("");
  const [menuExpanded, setMenuExpanded] = useState(true);
  const [parentChildLinked, setParentChildLinked] = useState(true);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [halfCheckedKeys, setHalfCheckedKeys] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const { loading, list, total, queryParams, setQueryParams, fetchList } = useTableQuery<
    TenantPlanItem,
    TenantPlanQueryParams
  >({ fetcher: TenantPlanAPI.getPage });

  const menuTreeData = useMemo(() => toTreeData(menuPermOptions), [menuPermOptions]);
  const allMenuKeys = useMemo(() => collectKeys(menuTreeData), [menuTreeData]);

  useEffect(() => {
    if (menuExpanded) setExpandedKeys(allMenuKeys);
  }, [allMenuKeys, menuExpanded]);

  function handleSearch() {
    setQueryParams((prev) => ({ ...prev, ...searchForm.getFieldsValue(), pageNum: 1 }));
  }

  function handleReset() {
    searchForm.resetFields();
    setQueryParams((prev) => ({ ...prev, keywords: undefined, status: undefined, pageNum: 1 }));
  }

  function openCreateDialog() {
    setEditingId(undefined);
    planForm.resetFields();
    planForm.setFieldsValue(INITIAL_FORM_DATA);
    setDialogOpen(true);
  }

  async function openUpdateDialog(planId?: number) {
    if (!planId) return;
    const data = await TenantPlanAPI.getFormData(String(planId));
    setEditingId(planId);
    planForm.resetFields();
    planForm.setFieldsValue({
      ...data,
      status: data.status ?? CommonStatus.ENABLED,
      sort: data.sort ?? 1,
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    const values = await validateForm(planForm);
    if (!values) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await TenantPlanAPI.update(String(editingId), { ...values, id: editingId });
      } else {
        await TenantPlanAPI.create(values);
      }
      message.success(t("common.saveSuccess"));
      setDialogOpen(false);
      fetchList();
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(planId?: number) {
    if (!planId) return;

    modal.confirm({
      title: t("common.tips"),
      content: t("system.tenantPlan.deleteConfirm"),
      okButtonProps: { danger: true },
      onOk: async () => {
        await TenantPlanAPI.deleteByIds(String(planId));
        message.success(t("common.deleteSuccess"));
        fetchList();
      },
    });
  }

  /** 打开菜单配置抽屉并回显已分配菜单 */
  async function openMenuDrawer(record: TenantPlanItem) {
    if (!record.id) return;

    setMenuDrawerOpen(true);
    setCheckedPlan({ id: record.id, name: record.name });

    const [menuOptions, menuIds] = await Promise.all([
      MenuAPI.getOptions({ scope: MenuScope.TENANT }),
      TenantPlanAPI.getPlanMenuIds(record.id),
    ]);

    const options = menuOptions ?? [];
    setMenuPermOptions(options);
    setCheckedKeys(toLeafKeys(options, menuIds ?? []));
    setHalfCheckedKeys([]);
  }

  /** 关闭菜单配置抽屉并清理临时状态 */
  function closeMenuDrawer() {
    setMenuDrawerOpen(false);
    setMenuKeyword("");
    setMenuExpanded(true);
    setParentChildLinked(true);
    setCheckedKeys([]);
    setHalfCheckedKeys([]);
    setMenuPermOptions([]);
  }

  /** 提交当前套餐的菜单权限配置 */
  async function handleMenuSubmit() {
    const planId = checkedPlan.id;
    if (!planId) return;

    // 半选的父级要一并下发，否则后端拼不出菜单树
    const menuIds = [...checkedKeys, ...halfCheckedKeys]
      .map(Number)
      .filter((value) => !Number.isNaN(value));

    setSubmitting(true);
    try {
      await TenantPlanAPI.updatePlanMenus(planId, menuIds);
      message.success(t("system.tenantPlan.menuConfigSuccess"));
      setMenuDrawerOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  const columns: TableProps<TenantPlanItem>["columns"] = [
    {
      title: t("common.index"),
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    { title: t("system.tenantPlan.name"), dataIndex: "name", minWidth: 120 },
    { title: t("system.tenantPlan.code"), dataIndex: "code", width: 160 },
    {
      title: t("common.status"),
      dataIndex: "status",
      width: 100,
      render: (status: number) =>
        status === CommonStatus.ENABLED ? (
          <Tag color="success">{t("system.tenantPlan.statusEnabled")}</Tag>
        ) : (
          <Tag color="default">{t("system.tenantPlan.statusDisabled")}</Tag>
        ),
    },
    { title: t("common.sort"), dataIndex: "sort", width: 80 },
    { title: t("common.remark"), dataIndex: "remark", minWidth: 140 },
    { title: t("common.createTime"), dataIndex: "createTime", width: 180 },
    {
      title: t("common.operate"),
      key: "operate",
      width: 240,
      fixed: "right",
      render: (_, record) => (
        <Space size={0}>
          <Auth perm="sys:tenant-plan:assign">
            <Button type="link" size="small" onClick={() => openMenuDrawer(record)}>
              {t("system.tenantPlan.menuConfig")}
            </Button>
          </Auth>
          <Auth perm="sys:tenant-plan:update">
            <Button type="link" size="small" onClick={() => openUpdateDialog(record.id)}>
              {t("common.update")}
            </Button>
          </Auth>
          <Auth perm="sys:tenant-plan:delete">
            <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>
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
            <Input placeholder={t("system.tenantPlan.keyword")} allowClear className="w-220px" />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}>
            <Select
              allowClear
              placeholder={t("system.tenantPlan.all")}
              className="w-120px"
              options={[
                { value: CommonStatus.ENABLED, label: t("system.tenantPlan.statusEnabled") },
                { value: CommonStatus.DISABLED, label: t("system.tenantPlan.statusDisabled") },
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
            <Auth perm="sys:tenant-plan:create">
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDialog}>
                {t("common.create")}
              </Button>
            </Auth>
          </Space>

          <RefreshButton onClick={fetchList} loading={loading} />
        </div>

        <Table<TenantPlanItem>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          scroll={{ x: 1200 }}
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
        title={editingId ? t("system.tenantPlan.editTitle") : t("system.tenantPlan.createTitle")}
        width={520}
        open={dialogOpen}
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => setDialogOpen(false)}
        destroyOnHidden
      >
        <Form form={planForm} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} className="pt-4">
          <Form.Item
            name="name"
            label={t("system.tenantPlan.name")}
            rules={[{ required: true, message: t("system.tenantPlan.nameRequired") }]}
          >
            <Input placeholder={t("system.tenantPlan.namePlaceholder")} />
          </Form.Item>
          <Form.Item
            name="code"
            label={t("system.tenantPlan.code")}
            rules={[{ required: true, message: t("system.tenantPlan.codeRequired") }]}
          >
            <Input placeholder={t("system.tenantPlan.codePlaceholder")} />
          </Form.Item>
          <Form.Item
            name="status"
            label={t("common.status")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Radio.Group>
              <Radio value={CommonStatus.ENABLED}>{t("system.tenantPlan.statusEnabled")}</Radio>
              <Radio value={CommonStatus.DISABLED}>{t("system.tenantPlan.statusDisabled")}</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="sort" label={t("common.sort")}>
            <InputNumber min={0} className="w-120px" />
          </Form.Item>
          <Form.Item name="remark" label={t("common.remark")}>
            <Input.TextArea rows={3} placeholder={t("system.tenantPlan.optional")} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={t("system.tenantPlan.menuConfigTitle", { name: checkedPlan.name })}
        width={600}
        open={menuDrawerOpen}
        onClose={closeMenuDrawer}
        footer={
          <Space className="flex-x-end">
            <Button onClick={closeMenuDrawer}>{t("common.cancel")}</Button>
            <Button type="primary" loading={submitting} onClick={handleMenuSubmit}>
              {t("common.confirm")}
            </Button>
          </Space>
        }
      >
        <div className="flex-x-between mb-3">
          <Input
            value={menuKeyword}
            allowClear
            className="w-150px"
            prefix={<SearchOutlined />}
            placeholder={t("system.tenantPlan.menuKeyword")}
            onChange={(event) => setMenuKeyword(event.target.value)}
          />

          <Space>
            <Button size="small" onClick={() => setMenuExpanded((prev) => !prev)}>
              {menuExpanded ? t("system.tenantPlan.collapse") : t("system.tenantPlan.expand")}
            </Button>
            <Checkbox
              checked={parentChildLinked}
              onChange={(event) => {
                setParentChildLinked(event.target.checked);
                setHalfCheckedKeys([]);
              }}
            >
              {t("system.tenantPlan.parentChildLinked")}
            </Checkbox>
            <Tooltip title={t("system.tenantPlan.linkTip")}>
              <QuestionCircleOutlined />
            </Tooltip>
          </Space>
        </div>

        <Tree
          checkable
          treeData={menuTreeData}
          filterTreeNode={(node) => String(node.title ?? "").includes(menuKeyword)}
          checkStrictly={!parentChildLinked}
          checkedKeys={
            parentChildLinked ? checkedKeys : { checked: checkedKeys, halfChecked: halfCheckedKeys }
          }
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys.map(String))}
          onCheck={(keys, info) => {
            if (Array.isArray(keys)) {
              setCheckedKeys(keys.map(String));
              setHalfCheckedKeys((info.halfCheckedKeys ?? []).map(String));
              return;
            }
            setCheckedKeys(keys.checked.map(String));
            setHalfCheckedKeys(keys.halfChecked.map(String));
          }}
        />
      </Drawer>
    </div>
  );
}

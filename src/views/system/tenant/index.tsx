import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  DatePicker,
  Drawer,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Tree,
  type TableProps,
} from "antd";
import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import MenuAPI from "@/api/system/menu";
import TenantAPI from "@/api/system/tenant";
import TenantPlanAPI from "@/api/system/tenant-plan";
import type {
  TenantCreateForm,
  TenantForm,
  TenantItem,
  TenantQueryParams,
} from "@/api/system/tenant";
import type { OptionItem } from "@/api/common";
import Auth from "@/components/Auth";
import RefreshButton from "@/components/RefreshButton";
import { CommonStatus, MenuScope } from "@/enums";
import { useTableQuery } from "@/hooks/useTableQuery";
import { useAuth } from "@/hooks/useAuth";
import { validateForm } from "@/utils/form";
import { isPlatformTenantId } from "@/utils/tenant";

/** 时间格式，与后端约定的字符串格式一致 */
const TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

/** 新增租户时的表单初始值 */
const INITIAL_FORM_DATA: TenantForm & TenantCreateForm = {
  id: undefined,
  name: "",
  code: "",
  domain: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  planId: undefined,
  remark: "",
  expireTime: undefined,
  status: CommonStatus.ENABLED,
  adminUsername: "",
};

/** 树形选项节点 */
interface TreeNode {
  key: string;
  title: string;
  children?: TreeNode[];
}

/**
 * 菜单选项树转 antd Tree 数据
 */
function toTreeData(options: OptionItem[]): TreeNode[] {
  return options.map((option) => ({
    key: String(option.value),
    title: option.label,
    children: option.children?.length ? toTreeData(option.children) : undefined,
  }));
}

/**
 * 过滤菜单树，仅保留套餐允许的节点
 */
function filterMenuOptions(options: OptionItem[], allowedIds: Set<number>): OptionItem[] {
  return options.reduce<OptionItem[]>((acc, option) => {
    const children = option.children ? filterMenuOptions(option.children, allowedIds) : [];
    if (allowedIds.has(Number(option.value)) || children.length > 0) {
      acc.push({ ...option, children: children.length > 0 ? children : undefined });
    }
    return acc;
  }, []);
}

/**
 * 统一菜单 ID 为 number 并过滤无效值
 */
function normalizeMenuIds(menuIds: Array<number | string>): number[] {
  return menuIds.map((menuId) => Number(menuId)).filter((menuId) => !Number.isNaN(menuId));
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

/** 租户管理 */
export default function TenantList() {
  const { t } = useTranslation();
  const { message, modal } = AntdApp.useApp();
  const { hasPermission } = useAuth();

  const [searchForm] = Form.useForm<TenantQueryParams>();
  const [tenantForm] = Form.useForm<TenantForm & TenantCreateForm>();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  // 套餐选项，与租户表单、更换套餐弹窗共用
  const [planOptions, setPlanOptions] = useState<OptionItem[]>([]);

  // 更换套餐弹窗
  const [planSelectOpen, setPlanSelectOpen] = useState(false);
  // 套餐功能配置抽屉
  const [planConfigOpen, setPlanConfigOpen] = useState(false);

  const [checkedTenant, setCheckedTenant] = useState<{
    id?: number;
    name?: string;
    planId?: number;
  }>({});
  const [checkedTenantForm, setCheckedTenantForm] = useState<TenantForm | null>(null);
  const [tenantPlanId, setTenantPlanId] = useState<number>();
  const [planMenuIds, setPlanMenuIds] = useState<number[]>([]);
  const [originalEnabledMenuIds, setOriginalEnabledMenuIds] = useState<number[]>([]);
  const [menuPermOptions, setMenuPermOptions] = useState<OptionItem[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [halfCheckedKeys, setHalfCheckedKeys] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const canAssignPlan = hasPermission("sys:tenant:plan-assign");

  const { loading, list, total, queryParams, setQueryParams, fetchList } = useTableQuery<
    TenantItem,
    TenantQueryParams
  >({
    // 后端返回的 planId 可能是字符串，列表里统一转成 number
    fetcher: async (params) => {
      const data = await TenantAPI.getPage(params);
      return {
        list: (data.list ?? []).map((item) => ({
          ...item,
          planId: item.planId != null ? Number(item.planId) : undefined,
        })),
        total: data.total,
      };
    },
  });

  useEffect(() => {
    fetchPlanOptions();
  }, []);

  const planTreeData = useMemo(() => toTreeData(menuPermOptions), [menuPermOptions]);

  /** 加载租户套餐选项 */
  async function fetchPlanOptions() {
    const options = await TenantPlanAPI.getOptions();
    setPlanOptions(
      (options ?? []).map((item) => ({
        ...item,
        value: item.value != null ? Number(item.value) : item.value,
      }))
    );
  }

  /** 根据套餐 ID 解析显示名称 */
  function resolvePlanLabel(planId?: number) {
    if (planId == null) return "-";
    return planOptions.find((item) => Number(item.value) === planId)?.label ?? String(planId);
  }

  function handleSearch() {
    setQueryParams((prev) => ({ ...prev, ...searchForm.getFieldsValue(), pageNum: 1 }));
  }

  function handleReset() {
    searchForm.resetFields();
    setQueryParams((prev) => ({ ...prev, keywords: undefined, status: undefined, pageNum: 1 }));
  }

  async function openDialog(tenantId?: string) {
    setDialogOpen(true);
    tenantForm.resetFields();

    if (tenantId) {
      setEditingId(tenantId);
      const data = await TenantAPI.getFormData(tenantId);
      const planId = data.planId != null ? Number(data.planId) : undefined;
      tenantForm.setFieldsValue({
        ...data,
        // 平台租户不参与套餐配置
        planId: isPlatformTenantId(data.id) ? undefined : planId,
        adminUsername: "",
        expireTime: data.expireTime ? (dayjs(data.expireTime) as unknown as string) : undefined,
      });
      return;
    }

    setEditingId(undefined);
    tenantForm.setFieldsValue(INITIAL_FORM_DATA);
  }

  async function handleSubmit() {
    const values = await validateForm(tenantForm);
    if (!values) return;

    const expireTime = values.expireTime
      ? dayjs(values.expireTime as unknown as string).format(TIME_FORMAT)
      : undefined;

    setSubmitting(true);
    try {
      if (editingId) {
        const payload: TenantForm = {
          id: values.id,
          name: values.name,
          code: values.code,
          domain: values.domain,
          contactName: values.contactName,
          contactPhone: values.contactPhone,
          contactEmail: values.contactEmail,
          planId: values.planId,
          remark: values.remark,
          expireTime,
          status: values.status,
        };
        await TenantAPI.update(editingId, payload);
        message.success(t("common.saveSuccess"));
      } else {
        const payload: TenantCreateForm = {
          name: values.name,
          code: values.code,
          domain: values.domain,
          contactName: values.contactName,
          contactPhone: values.contactPhone,
          contactEmail: values.contactEmail,
          planId: values.planId,
          remark: values.remark,
          expireTime,
          adminUsername: values.adminUsername,
        };
        const result = await TenantAPI.create(payload);
        message.success(
          t("system.tenant.createSuccess", { username: result?.adminUsername ?? "" })
        );
      }

      setDialogOpen(false);
      fetchList();
    } finally {
      setSubmitting(false);
    }
  }

  /** 删除单个或批量租户 */
  function handleDelete(tenantIds: string) {
    modal.confirm({
      title: t("common.tips"),
      content: t("system.tenant.deleteConfirm"),
      okButtonProps: { danger: true },
      onOk: async () => {
        await TenantAPI.deleteByIds(tenantIds);
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

  /** 重置套餐相关的全部临时状态 */
  function resetPlanState() {
    setPlanSelectOpen(false);
    setPlanConfigOpen(false);
    setOriginalEnabledMenuIds([]);
    setTenantPlanId(undefined);
    setPlanMenuIds([]);
    setMenuPermOptions([]);
    setCheckedKeys([]);
    setHalfCheckedKeys([]);
    setExpandedKeys([]);
    setCheckedTenant({});
    setCheckedTenantForm(null);
  }

  /** 按套餐范围同步勾选菜单 */
  function applyCheckedMenus(options: OptionItem[], allowedIds: number[], tenantMenuIds: number[]) {
    const allowedSet = new Set(allowedIds);
    const targetIds =
      tenantMenuIds.length > 0
        ? tenantMenuIds.filter((menuId) => allowedSet.has(menuId))
        : allowedIds;

    setCheckedKeys(toLeafKeys(options, targetIds));
    setHalfCheckedKeys([]);
  }

  /** 加载目标套餐的可用菜单，并刷新勾选状态 */
  async function loadPlanMenus(planId: number | undefined, tenantMenuIds: number[]) {
    if (!planId) {
      setPlanMenuIds([]);
      setMenuPermOptions([]);
      setCheckedKeys([]);
      setHalfCheckedKeys([]);
      return [];
    }

    const menuIds = normalizeMenuIds(await TenantPlanAPI.getPlanMenuIds(planId));
    const allowedSet = new Set(menuIds);
    const menuOptions = await MenuAPI.getOptions({ scope: MenuScope.TENANT });
    const filtered = allowedSet.size ? filterMenuOptions(menuOptions ?? [], allowedSet) : [];

    setPlanMenuIds(menuIds);
    setMenuPermOptions(filtered);
    setExpandedKeys(filtered.map((option) => String(option.value)));
    applyCheckedMenus(filtered, menuIds, tenantMenuIds);

    return menuIds;
  }

  /**
   * 拉取租户的表单数据、租户菜单与套餐菜单
   * @returns 租户当前套餐，供调用方接着判断能否进入功能配置
   */
  async function loadTenantContext(tenantId: number, tenantName?: string) {
    const [tenantFormData, menuIds] = await Promise.all([
      TenantAPI.getFormData(String(tenantId)),
      canAssignPlan ? TenantAPI.getTenantMenuIds(tenantId) : Promise.resolve([]),
    ]);

    const planId = tenantFormData.planId != null ? Number(tenantFormData.planId) : undefined;
    const tenantMenuIds = normalizeMenuIds(menuIds);

    setCheckedTenantForm(tenantFormData);
    setTenantPlanId(planId);
    setCheckedTenant({ id: tenantId, name: tenantName ?? String(tenantId), planId });

    await loadPlanMenus(planId, tenantMenuIds);
    setOriginalEnabledMenuIds(tenantMenuIds.length > 0 ? [...tenantMenuIds] : []);

    return { planId, tenantFormData };
  }

  /** 打开更换套餐弹窗 */
  async function openPlanSelectDialog(record: TenantItem) {
    const tenantId = Number(record.id);
    if (!Number.isFinite(tenantId) || isPlatformTenantId(tenantId)) return;

    setPlanSelectOpen(true);
    await loadTenantContext(tenantId, record.name);
  }

  /** 打开套餐功能配置抽屉 */
  async function openPlanConfigDialog(record: TenantItem) {
    const tenantId = Number(record.id);
    if (!Number.isFinite(tenantId) || isPlatformTenantId(tenantId)) return;

    const { planId } = await loadTenantContext(tenantId, record.name);

    // 没有套餐就没有可选范围，先去换套餐
    if (!planId) {
      message.warning(t("system.tenant.selectPlanFirst"));
      return;
    }

    setPlanConfigOpen(true);
    setPlanSelectOpen(false);
  }

  /** 提交更换套餐：改套餐并保留套餐范围内原有的租户菜单 */
  async function handlePlanSelectSubmit() {
    const tenantId = checkedTenant.id;
    if (!tenantId) return;
    if (!tenantPlanId) {
      message.warning(t("system.tenant.planRequired"));
      return;
    }
    if (planMenuIds.length === 0) {
      message.warning(t("system.tenant.planMenuEmpty"));
      return;
    }

    modal.confirm({
      title: t("system.tenant.confirmChangeTitle"),
      content: t("system.tenant.confirmChange", {
        name: checkedTenant.name ?? "",
        current: resolvePlanLabel(checkedTenant.planId),
        target: resolvePlanLabel(tenantPlanId),
      }),
      onOk: async () => {
        const tenantFormData = checkedTenantForm;
        if (!tenantFormData) return;

        await TenantAPI.update(String(tenantId), { ...tenantFormData, planId: tenantPlanId });

        if (canAssignPlan) {
          const allowedSet = new Set(planMenuIds);
          const keepMenuIds = originalEnabledMenuIds.filter((menuId) => allowedSet.has(menuId));
          await TenantAPI.updateTenantMenus(tenantId, keepMenuIds);
        }

        message.success(t("system.tenant.planChanged"));
        setCheckedTenant((prev) => ({ ...prev, planId: tenantPlanId }));
        setPlanSelectOpen(false);
        fetchList();
      },
    });
  }

  /** 提交套餐功能配置：把勾选（含半选的父级）在套餐范围内落库 */
  async function handlePlanConfigSubmit() {
    const tenantId = checkedTenant.id;
    if (!tenantId) return;
    if (!tenantPlanId) {
      message.warning(t("system.tenant.planRequired"));
      return;
    }

    const tenantFormData = checkedTenantForm;
    if (!tenantFormData) return;

    setSubmitting(true);
    try {
      await TenantAPI.update(String(tenantId), { ...tenantFormData, planId: tenantPlanId });

      if (canAssignPlan) {
        const allowedSet = new Set(planMenuIds);
        // 半选的父级要一并下发，否则后端拼不出菜单树
        const rawMenuIds = [...checkedKeys, ...halfCheckedKeys]
          .map(Number)
          .filter((value) => !Number.isNaN(value));
        const filteredMenuIds = rawMenuIds.filter((menuId) => allowedSet.has(menuId));
        await TenantAPI.updateTenantMenus(tenantId, filteredMenuIds);
      }

      message.success(t("system.tenant.configUpdated"));
      setPlanConfigOpen(false);
      fetchList();
    } finally {
      setSubmitting(false);
    }
  }

  const isPlatformTenant = isPlatformTenantId(editingId);

  const columns: TableProps<TenantItem>["columns"] = [
    { title: t("system.tenant.name"), dataIndex: "name", minWidth: 140 },
    { title: t("system.tenant.code"), dataIndex: "code", width: 120 },
    {
      title: t("system.tenant.plan"),
      dataIndex: "planId",
      minWidth: 120,
      render: (planId: number) => resolvePlanLabel(planId),
    },
    { title: t("system.tenant.domain"), dataIndex: "domain", minWidth: 140 },
    { title: t("system.tenant.contactName"), dataIndex: "contactName", width: 100 },
    { title: t("system.tenant.contactPhone"), dataIndex: "contactPhone", width: 120 },
    {
      title: t("common.status"),
      dataIndex: "status",
      width: 90,
      render: (status: number) =>
        status === CommonStatus.ENABLED ? (
          <Tag color="success">{t("system.tenant.statusNormal")}</Tag>
        ) : (
          <Tag color="default">{t("common.disabled")}</Tag>
        ),
    },
    { title: t("system.tenant.expireTime"), dataIndex: "expireTime", width: 180 },
    { title: t("common.createTime"), dataIndex: "createTime", width: 180 },
    {
      title: t("common.operate"),
      key: "operate",
      width: 320,
      fixed: "right",
      render: (_, record) => (
        <Space size={0}>
          {!isPlatformTenantId(record.id) && (
            <Auth perm="sys:tenant:plan-assign">
              <Button type="link" size="small" onClick={() => openPlanSelectDialog(record)}>
                {t("system.tenant.planChange")}
              </Button>
            </Auth>
          )}
          {!isPlatformTenantId(record.id) && (
            <Auth perm="sys:tenant:plan-assign">
              <Button
                type="link"
                size="small"
                disabled={!record.planId}
                onClick={() => openPlanConfigDialog(record)}
              >
                {t("system.tenant.planConfig")}
              </Button>
            </Auth>
          )}
          <Auth perm="sys:tenant:update">
            <Button type="link" size="small" onClick={() => record.id && openDialog(record.id)}>
              {t("common.update")}
            </Button>
          </Auth>
          {!isPlatformTenantId(record.id) && (
            <Auth perm="sys:tenant:delete">
              <Button
                type="link"
                size="small"
                danger
                onClick={() => record.id && handleDelete(record.id)}
              >
                {t("common.delete")}
              </Button>
            </Auth>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card className="page-search">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keywords" label={t("common.keyword")}>
            <Input placeholder={t("system.tenant.keyword")} allowClear className="w-240px" />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}>
            <Select
              allowClear
              placeholder={t("system.tenant.all")}
              className="w-120px"
              options={[
                { value: CommonStatus.ENABLED, label: t("system.tenant.statusNormal") },
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
            <Auth perm="sys:tenant:create">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openDialog()}>
                {t("common.create")}
              </Button>
            </Auth>
            <Auth perm="sys:tenant:delete">
              <Button danger disabled={selectedIds.length === 0} onClick={handleBatchDelete}>
                {t("common.delete")}
              </Button>
            </Auth>
          </Space>

          <RefreshButton onClick={fetchList} loading={loading} />
        </div>

        <Table<TenantItem>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          scroll={{ x: 1500 }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys.map(String)),
            // 平台租户是不可删除的内置租户，不参与批量操作
            getCheckboxProps: (record) => ({ disabled: isPlatformTenantId(record.id) }),
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
        title={editingId ? t("system.tenant.editTitle") : t("system.tenant.createTitle")}
        width={600}
        open={dialogOpen}
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => setDialogOpen(false)}
        destroyOnHidden
      >
        <Form form={tenantForm} labelCol={{ span: 6 }} wrapperCol={{ span: 17 }} className="pt-4">
          <Form.Item
            name="name"
            label={t("system.tenant.name")}
            rules={[{ required: true, message: t("system.tenant.nameRequired") }]}
          >
            <Input placeholder={t("system.tenant.namePlaceholder")} />
          </Form.Item>
          <Form.Item
            name="code"
            label={t("system.tenant.code")}
            rules={[{ required: true, message: t("system.tenant.codeRequired") }]}
          >
            {/* 租户编码创建后不允许改，它同时用于数据隔离 */}
            <Input disabled={Boolean(editingId)} placeholder={t("system.tenant.codePlaceholder")} />
          </Form.Item>
          <Form.Item name="domain" label={t("system.tenant.domain")}>
            <Input placeholder="demo.youlai.tech" />
          </Form.Item>
          {!isPlatformTenant && !editingId && (
            <Form.Item
              name="planId"
              label={t("system.tenant.plan")}
              rules={[{ required: true, message: t("system.tenant.planRequired") }]}
            >
              <Select placeholder={t("system.tenant.planPlaceholder")} options={planOptions} />
            </Form.Item>
          )}
          <Form.Item name="contactName" label={t("system.tenant.contactName")}>
            <Input placeholder={t("system.tenant.optional")} />
          </Form.Item>
          <Form.Item name="contactPhone" label={t("system.tenant.contactPhone")}>
            <Input placeholder={t("system.tenant.optional")} />
          </Form.Item>
          <Form.Item name="contactEmail" label={t("system.tenant.contactEmail")}>
            <Input placeholder={t("system.tenant.optional")} />
          </Form.Item>
          <Form.Item name="expireTime" label={t("system.tenant.expireTime")}>
            <DatePicker
              showTime
              className="w-full"
              format={TIME_FORMAT}
              placeholder={t("system.tenant.expirePlaceholder")}
            />
          </Form.Item>
          {!editingId && (
            <Form.Item name="adminUsername" label={t("system.tenant.adminUsername")}>
              <Input placeholder={t("system.tenant.adminUsernamePlaceholder")} />
            </Form.Item>
          )}
          {Boolean(editingId) && (
            <Form.Item name="status" label={t("common.status")}>
              <Radio.Group>
                <Radio value={CommonStatus.ENABLED}>{t("system.tenant.statusNormal")}</Radio>
                <Radio value={CommonStatus.DISABLED}>{t("common.disabled")}</Radio>
              </Radio.Group>
            </Form.Item>
          )}
          <Form.Item name="remark" label={t("common.remark")}>
            <Input.TextArea rows={3} placeholder={t("system.tenant.optional")} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t("system.tenant.planChange")}
        width={520}
        open={planSelectOpen}
        confirmLoading={submitting}
        onCancel={resetPlanState}
        okText={t("system.tenant.confirmChangeTitle")}
        okButtonProps={{ disabled: !tenantPlanId || planMenuIds.length === 0 }}
        onOk={handlePlanSelectSubmit}
      >
        <Form layout="horizontal" labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} className="pt-2">
          <Form.Item label={t("system.tenant.currentPlan")}>
            <Input value={resolvePlanLabel(checkedTenant.planId)} disabled />
          </Form.Item>
          <Form.Item label={t("system.tenant.targetPlan")}>
            <Select
              value={tenantPlanId}
              placeholder={t("system.tenant.planPlaceholder")}
              options={planOptions}
              onChange={(value: number) => {
                setTenantPlanId(value);
                loadPlanMenus(value, []);
              }}
            />
          </Form.Item>
        </Form>

        <div className="mb-2 font-medium">{t("system.tenant.upgradeTitle")}</div>
        <div className="mb-3">{t("system.tenant.upgradeDesc")}</div>
        <div className="mb-2 font-medium">{t("system.tenant.downgradeTitle")}</div>
        <Alert type="warning" showIcon message={t("system.tenant.downgradeWarning")} />
      </Modal>

      <Drawer
        title={t("system.tenant.planConfig")}
        width={640}
        open={planConfigOpen}
        onClose={resetPlanState}
        footer={
          <Space className="flex-x-end">
            <Button onClick={resetPlanState}>{t("common.cancel")}</Button>
            <Button
              type="primary"
              loading={submitting}
              disabled={planMenuIds.length === 0}
              onClick={handlePlanConfigSubmit}
            >
              {t("system.tenant.saveConfig")}
            </Button>
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          className="mb-3"
          message={t("system.tenant.configAlert", { plan: resolvePlanLabel(tenantPlanId) })}
        />
        <div className="mb-2 text-xs text-secondary">{t("system.tenant.configScopeTip")}</div>

        <div className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
          <Tree
            checkable
            treeData={planTreeData}
            checkedKeys={checkedKeys}
            expandedKeys={expandedKeys}
            onExpand={(keys) => setExpandedKeys(keys.map(String))}
            onCheck={(keys, info) => {
              setCheckedKeys((Array.isArray(keys) ? keys : keys.checked).map(String));
              setHalfCheckedKeys((info.halfCheckedKeys ?? []).map(String));
            }}
          />
        </div>
      </Drawer>
    </div>
  );
}

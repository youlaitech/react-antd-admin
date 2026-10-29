import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Radio,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  TreeSelect,
  type TableProps,
} from "antd";
import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  LeftOutlined,
  FullscreenOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import DeptAPI from "@/api/system/dept";
import MenuAPI from "@/api/system/menu";
import RoleAPI from "@/api/system/role";
import type { MenuItem } from "@/api/system/menu";
import type { RoleForm, RoleItem, RoleQueryParams } from "@/api/system/role";
import type { OptionItem } from "@/api/common";
import Auth from "@/components/Auth";
import StatusDot from "@/components/StatusDot";
import { ROLE_ROOT } from "@/constants";
import { CommonStatus, MenuType } from "@/enums";
import { useFullscreen } from "@/hooks/useFullscreen";
import { validateForm } from "@/utils/form";

import "./index.scss";

/** 自定义数据权限取值 */
const DATA_SCOPE_CUSTOM = 5;

/** 勾选模式 */
type CheckMode = "linked" | "independent";

/** 权限表格行 */
interface PermRow {
  /** 节点 ID */
  id: string;
  /** 节点名称 */
  name: string;
  /** 是否为目录分组行 */
  group: boolean;
  /** 层级，仅用于缩进 */
  depth: number;
  /** 行内展示的按钮权限 */
  buttons: PermRow[];
}

/** 树形选项节点 */
interface TreeOption {
  value: string;
  label: string;
  children?: TreeOption[];
}

/**
 * 整理菜单层级
 */
function normalizeMenuTree(list: MenuItem[]): MenuItem[] {
  const hasNested = list.some((menu) => (menu.children?.length ?? 0) > 0);
  if (hasNested) return list;

  const nodeMap = new Map<string, MenuItem>();
  list.forEach((menu) => nodeMap.set(String(menu.id), { ...menu }));

  const roots: MenuItem[] = [];
  nodeMap.forEach((menu) => {
    const parent = nodeMap.get(String(menu.parentId ?? "0"));
    if (parent) {
      parent.children = [...(parent.children ?? []), menu];
    } else {
      roots.push(menu);
    }
  });

  return roots;
}

/**
 * 部门选项转树选择数据
 */
function toDeptTreeData(options: OptionItem[]): TreeOption[] {
  return options.map((option) => ({
    value: String(option.value),
    label: option.label,
    children: option.children?.length ? toDeptTreeData(option.children) : undefined,
  }));
}

/**
 * 角色管理
 */
export default function RoleList() {
  const { t } = useTranslation();
  const { message, modal } = AntdApp.useApp();
  const { toggleFullscreen } = useFullscreen();

  const [roleForm] = Form.useForm<RoleForm>();

  // 左侧角色列表折叠状态
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<RoleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [keywords, setKeywords] = useState("");
  const [queryParams, setQueryParams] = useState<RoleQueryParams>({ pageNum: 1, pageSize: 20 });

  const currentRoleRef = useRef<RoleItem | undefined>(undefined);
  const [currentRole, setCurrentRole] = useState<RoleItem | undefined>(undefined);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [deptOptions, setDeptOptions] = useState<OptionItem[]>([]);

  // 权限表数据与勾选状态
  const [permRows, setPermRows] = useState<PermRow[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [permLoading, setPermLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permKeywords, setPermKeywords] = useState("");
  const [checkMode, setCheckMode] = useState<CheckMode>("linked");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // 节点祖先链与节点全家族，父子联动时用
  const nodeParentsRef = useRef(new Map<string, string[]>());
  const nodeFamiliesRef = useRef(new Map<string, string[]>());

  // 菜单树只请求一次，切换角色时复用
  const menuTreeLoadedRef = useRef(false);

  const isRootRole = currentRole?.code === ROLE_ROOT;

  const dataScopeOptions = useMemo(
    () => [
      { label: t("system.role.dataScopeAll"), value: 1 },
      { label: t("system.role.dataScopeDeptAndChild"), value: 2 },
      { label: t("system.role.dataScopeDept"), value: 3 },
      { label: t("system.role.dataScopeSelf"), value: 4 },
      { label: t("system.role.dataScopeCustom"), value: DATA_SCOPE_CUSTOM },
    ],
    [t]
  );

  const deptTreeData = useMemo(() => toDeptTreeData(deptOptions), [deptOptions]);

  // 菜单树转权限表格行
  const buildPermRows = useCallback((nodes: MenuItem[], depth = 0, ancestors: string[] = []) => {
    const rows: PermRow[] = [];

    nodes.forEach((node) => {
      const id = String(node.id);
      const children = node.children ?? [];
      const subMenus = children.filter((child) => child.type !== MenuType.BUTTON);
      const buttons: PermRow[] = children
        .filter((child) => child.type === MenuType.BUTTON)
        .map((child) => ({
          id: String(child.id),
          name: child.name ?? "",
          group: false,
          depth: depth + 1,
          buttons: [],
        }));

      rows.push({
        id,
        name: node.name ?? "",
        group: subMenus.length > 0,
        depth,
        buttons,
      });

      buttons.forEach((btn) => {
        nodeParentsRef.current.set(btn.id, [...ancestors, id]);
        nodeFamiliesRef.current.set(btn.id, [btn.id]);
      });

      const childRows = buildPermRows(subMenus, depth + 1, [...ancestors, id]);
      rows.push(...childRows);

      nodeParentsRef.current.set(id, ancestors);
      nodeFamiliesRef.current.set(id, [
        id,
        ...buttons.map((btn) => btn.id),
        ...childRows.flatMap((row) => nodeFamiliesRef.current.get(row.id) ?? []),
      ]);
    });

    return rows;
  }, []);

  // 拉取菜单树并生成权限表格行
  const loadMenuTree = useCallback(async () => {
    if (menuTreeLoadedRef.current) return;

    const menuList = await MenuAPI.getList({});
    setPermRows(buildPermRows(normalizeMenuTree(menuList ?? [])));
    menuTreeLoadedRef.current = true;
  }, [buildPermRows]);

  // 拉取指定角色已分配的菜单权限并回显
  const loadRolePerm = useCallback(
    async (roleId?: string) => {
      if (!roleId) return;

      setPermLoading(true);
      try {
        await loadMenuTree();

        // 超级管理员拥有全部权限，不回显勾选
        if (currentRoleRef.current?.code === ROLE_ROOT) {
          setCheckedIds(new Set());
          return;
        }

        const menuIds = await RoleAPI.getRoleMenuIds(roleId);
        setCheckedIds(new Set((menuIds ?? []).map((menuId) => String(menuId))));
      } finally {
        setPermLoading(false);
      }
    },
    [loadMenuTree]
  );

  const fetchRoles = useCallback(
    async (preferRoleId?: string) => {
      setLoading(true);
      try {
        const data = await RoleAPI.getPage(queryParams);
        const rows = data.list ?? [];
        setList(rows);
        setTotal(data.total ?? 0);

        const targetId = preferRoleId ?? currentRoleRef.current?.id;
        const next = rows.find((row) => row.id === targetId) ?? rows[0];
        currentRoleRef.current = next;
        setCurrentRole(next);
        await loadRolePerm(next?.id);
      } finally {
        setLoading(false);
      }
    },
    [loadRolePerm, queryParams]
  );

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  /**
   * 按关键字查询角色
   */
  function handleSearch(nextKeywords = keywords) {
    setQueryParams((prev) => ({ ...prev, keywords: nextKeywords, pageNum: 1 }));
  }

  /**
   * 选中角色，右侧权限表随之切换
   */
  async function handleRoleClick(row: RoleItem) {
    if (row.id === currentRoleRef.current?.id) return;
    currentRoleRef.current = row;
    setCurrentRole(row);
    await loadRolePerm(row.id);
  }

  /**
   * 加载部门选项，首次使用时请求
   */
  async function ensureDeptOptions() {
    if (deptOptions.length > 0) return;
    setDeptOptions((await DeptAPI.getOptions()) ?? []);
  }

  async function openCreateDialog() {
    setEditingId(undefined);
    roleForm.resetFields();
    roleForm.setFieldsValue({ sort: 1, status: CommonStatus.ENABLED });
    await ensureDeptOptions();
    setDialogOpen(true);
  }

  async function openUpdateDialog(roleId?: string) {
    if (!roleId) return;
    const data = await RoleAPI.getFormData(roleId);
    await ensureDeptOptions();
    setEditingId(roleId);
    roleForm.resetFields();
    roleForm.setFieldsValue(data);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    const values = await validateForm(roleForm);
    if (!values) return;

    // 非自定义数据权限时不下发部门集合
    const payload: RoleForm = { ...values };
    if (payload.dataScope !== DATA_SCOPE_CUSTOM) payload.deptIds = undefined;

    setSubmitting(true);
    try {
      if (editingId) {
        await RoleAPI.update(editingId, payload);
      } else {
        await RoleAPI.create(payload);
      }
      message.success(t("common.saveSuccess"));
      setDialogOpen(false);
      fetchRoles(editingId);
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * 删除角色，删除后右侧联动到剩余角色
   */
  function handleDelete(roleId?: string) {
    if (!roleId) return;

    modal.confirm({
      title: t("common.tips"),
      content: t("system.role.deleteConfirm"),
      okButtonProps: { danger: true },
      onOk: async () => {
        await RoleAPI.deleteByIds(roleId);
        message.success(t("common.deleteSuccess"));
        fetchRoles();
      },
    });
  }

  /**
   * 勾选或取消权限节点
   */
  function handleNodeCheck(nodeId: string, checked: boolean) {
    setCheckedIds((prev) => {
      const next = new Set(prev);

      if (checkMode === "independent") {
        if (checked) {
          next.add(nodeId);
        } else {
          next.delete(nodeId);
        }
        return next;
      }

      const family = nodeFamiliesRef.current.get(nodeId) ?? [nodeId];
      if (checked) {
        [...family, ...(nodeParentsRef.current.get(nodeId) ?? [])].forEach((id) => next.add(id));
      } else {
        family.forEach((id) => next.delete(id));
      }
      return next;
    });
  }

  function toggleGroup(groupId: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  /**
   * 提交当前角色的菜单权限配置
   */
  async function handleSavePerm() {
    const roleId = currentRole?.id;
    if (!roleId) return;

    if (isRootRole) {
      message.warning(t("system.role.rootRoleTip"));
      return;
    }

    const menuIds = Array.from(checkedIds)
      .map(Number)
      .filter((menuId) => !Number.isNaN(menuId));

    setSaving(true);
    try {
      await RoleAPI.updateRoleMenus(roleId, menuIds);
      message.success(t("system.role.assignSuccess"));
    } finally {
      setSaving(false);
    }
  }

  // 按关键字过滤权限行，分组内任一行命中即整组保留
  const filteredRows = useMemo(() => {
    const keyword = permKeywords.trim();
    if (!keyword) return permRows;

    const hitRow = (row: PermRow) =>
      row.name.includes(keyword) || row.buttons.some((btn) => btn.name.includes(keyword));

    const result: PermRow[] = [];
    let groupRow: PermRow | null = null;
    let groupRows: PermRow[] = [];
    let groupHit = false;

    /**
     * 把命中的分组写入结果
     */
    const flushGroup = () => {
      if (groupRow && groupHit) result.push(groupRow, ...groupRows);
      groupRow = null;
      groupRows = [];
      groupHit = false;
    };

    permRows.forEach((row) => {
      if (row.group) {
        flushGroup();
        groupRow = row;
        groupHit = hitRow(row);
        return;
      }

      if (!groupRow) {
        if (hitRow(row)) result.push(row);
        return;
      }

      if (hitRow(row)) groupHit = true;
      groupRows.push(row);
    });

    flushGroup();
    return result;
  }, [permKeywords, permRows]);

  // 带下级菜单行的节点
  const collapsibleIds = useMemo(
    () => permRows.filter((row) => row.group).map((row) => row.id),
    [permRows]
  );

  const isAllCollapsed =
    collapsibleIds.length > 0 && collapsibleIds.every((id) => collapsedIds.has(id));

  // 权限表渲染数据：搜索时全部展开，避免命中的菜单被折叠藏起来
  const displayRows = useMemo(() => {
    if (permKeywords.trim() || collapsedIds.size === 0) return filteredRows;

    const visible: PermRow[] = [];
    let collapsedDepth: number | null = null;

    filteredRows.forEach((row) => {
      if (collapsedDepth !== null && row.depth > collapsedDepth) return;

      collapsedDepth = null;
      visible.push(row);
      if (row.group && collapsedIds.has(row.id)) collapsedDepth = row.depth;
    });

    return visible;
  }, [collapsedIds, filteredRows, permKeywords]);

  const columns: TableProps<PermRow>["columns"] = [
    {
      title: t("system.role.permName"),
      dataIndex: "name",
      minWidth: 240,
      render: (name: string, record) => (
        <div
          className={`role-perm__cell${record.group ? " is-group" : ""}`}
          style={{ paddingLeft: record.depth * 18 }}
        >
          {record.group ? (
            <DownOutlined
              className={`role-perm__caret${collapsedIds.has(record.id) ? " is-collapsed" : ""}`}
              onClick={() => toggleGroup(record.id)}
            />
          ) : (
            <span className="role-perm__caret-space" />
          )}
          <Checkbox
            checked={checkedIds.has(record.id)}
            disabled={isRootRole}
            onChange={(event) => handleNodeCheck(record.id, event.target.checked)}
          />
          <span className="role-perm__name" title={name}>
            {name}
          </span>
        </div>
      ),
    },
    {
      title: t("system.role.permItems"),
      key: "buttons",
      minWidth: 360,
      render: (_, record) => (
        <Space size={12} wrap>
          {record.buttons.map((btn) => (
            <Checkbox
              key={btn.id}
              checked={checkedIds.has(btn.id)}
              disabled={isRootRole}
              onChange={(event) => handleNodeCheck(btn.id, event.target.checked)}
            >
              {btn.name}
            </Checkbox>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container page-container--split role-page">
      <aside className={`page-aside${sidebarCollapsed ? " is-collapsed" : ""}`}>
        <div className="page-aside__inner">
          <div className="role-list">
            <div className="role-list__search">
              <Input
                value={keywords}
                placeholder={t("system.role.name")}
                allowClear
                onChange={(event) => {
                  setKeywords(event.target.value);
                  if (!event.target.value) handleSearch("");
                }}
                onPressEnter={() => handleSearch()}
              />
              <Auth perm="sys:role:create">
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDialog} />
              </Auth>
            </div>

            <Spin spinning={loading} classNames={{ root: "role-list__spin" }}>
              <div className="role-list__scroll">
                {list.map((row) => (
                  <div
                    key={row.id}
                    className={`role-list__item${row.id === currentRole?.id ? " is-active" : ""}${
                      row.status === CommonStatus.DISABLED ? " is-disabled" : ""
                    }`}
                    onClick={() => handleRoleClick(row)}
                  >
                    <div className="role-list__info">
                      <span className="role-list__title">
                        <StatusDot active={row.status === CommonStatus.ENABLED} />
                        <span className="role-list__name" title={row.name}>
                          {row.name}
                        </span>
                      </span>
                      <span className="role-list__meta">
                        <span className="role-list__code" title={row.code}>
                          {row.code}
                        </span>
                        {row.status !== CommonStatus.ENABLED && (
                          <span className="role-list__stopped">{t("common.disabled")}</span>
                        )}
                      </span>
                    </div>
                    {row.code !== ROLE_ROOT && (
                      <div className="role-list__actions">
                        <Auth perm="sys:role:update">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={(event) => {
                              event.stopPropagation();
                              openUpdateDialog(row.id);
                            }}
                          />
                        </Auth>
                        <Auth perm="sys:role:delete">
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(row.id);
                            }}
                          />
                        </Auth>
                      </div>
                    )}
                  </div>
                ))}

                {!loading && list.length === 0 && (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t("system.role.empty")}
                  />
                )}
              </div>
            </Spin>

            <div className="role-list__footer">
              <span>{t("system.role.count", { total })}</span>
              <Pagination
                size="small"
                current={queryParams.pageNum}
                pageSize={queryParams.pageSize}
                total={total}
                showSizeChanger={false}
                onChange={(pageNum) => setQueryParams((prev) => ({ ...prev, pageNum }))}
              />
            </div>
          </div>
        </div>

        <button
          className="page-aside__toggle"
          type="button"
          title={sidebarCollapsed ? t("system.role.expandAside") : t("system.role.collapseAside")}
          onClick={() => setSidebarCollapsed((prev) => !prev)}
        >
          {sidebarCollapsed ? <RightOutlined /> : <LeftOutlined />}
        </button>
      </aside>

      <div className="page-main">
        {currentRole ? (
          <Card className="page-content">
            <div className="role-perm__header">
              <div className="role-perm__row">
                <span className="role-perm__title">{t("system.role.funcPerm")}</span>
                <Tag color="processing">{currentRole.name}</Tag>
                {isRootRole && <Tag color="warning">{t("system.role.rootRoleTip")}</Tag>}
                <Auth perm="sys:role:assign">
                  <Button
                    type="primary"
                    className="ml-auto"
                    loading={saving}
                    disabled={isRootRole}
                    onClick={handleSavePerm}
                  >
                    {t("common.save")}
                  </Button>
                </Auth>
              </div>

              <div className="role-perm__row">
                <Input
                  value={permKeywords}
                  allowClear
                  className="role-perm__search"
                  placeholder={t("system.role.permName")}
                  prefix={<SearchOutlined />}
                  onChange={(event) => setPermKeywords(event.target.value)}
                />

                <Space className="ml-auto">
                  <Segmented
                    value={checkMode}
                    onChange={(value) => setCheckMode(value as CheckMode)}
                    options={[
                      { value: "linked", label: t("system.role.checkLinked") },
                      { value: "independent", label: t("system.role.checkIndependent") },
                    ]}
                  />
                  <Tooltip
                    title={isAllCollapsed ? t("system.role.expand") : t("system.role.collapse")}
                  >
                    <Button
                      icon={
                        <i
                          className={
                            isAllCollapsed ? "i-svg:add-box" : "i-svg:checkbox-indeterminate"
                          }
                        />
                      }
                      onClick={() =>
                        setCollapsedIds(isAllCollapsed ? new Set() : new Set(collapsibleIds))
                      }
                    />
                  </Tooltip>
                  <Tooltip title={t("tagsView.refresh")}>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => loadRolePerm(currentRole.id)}
                    />
                  </Tooltip>
                  <Tooltip title={t("navbar.fullscreen")}>
                    <Button icon={<FullscreenOutlined />} onClick={toggleFullscreen} />
                  </Tooltip>
                </Space>
              </div>
            </div>

            <Table<PermRow>
              rowKey="id"
              loading={permLoading}
              columns={columns}
              dataSource={displayRows}
              scroll={{ x: 700 }}
              pagination={false}
              rowClassName={(record) => (record.group ? "role-perm__row--group" : "")}
            />
          </Card>
        ) : (
          <Card className="page-content role-page__empty">
            <Empty description={t("system.role.selectTip")} />
          </Card>
        )}
      </div>

      <Modal
        title={editingId ? t("system.role.editTitle") : t("system.role.createTitle")}
        width={600}
        open={dialogOpen}
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => setDialogOpen(false)}
        destroyOnHidden
      >
        <Form form={roleForm} labelCol={{ span: 6 }} wrapperCol={{ span: 17 }} className="pt-4">
          <Form.Item
            name="name"
            label={t("system.role.name")}
            rules={[{ required: true, message: t("system.role.nameRequired") }]}
          >
            <Input placeholder={t("system.role.namePlaceholder")} />
          </Form.Item>
          <Form.Item
            name="code"
            label={t("system.role.code")}
            rules={[{ required: true, message: t("system.role.codeRequired") }]}
          >
            <Input placeholder={t("system.role.codePlaceholder")} />
          </Form.Item>
          <Form.Item
            name="dataScope"
            label={t("system.role.dataScope")}
            rules={[{ required: true, message: t("system.role.dataScopeRequired") }]}
          >
            <Select
              options={dataScopeOptions}
              placeholder={t("system.role.dataScopePlaceholder")}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, next) => prev.dataScope !== next.dataScope}>
            {({ getFieldValue }) =>
              getFieldValue("dataScope") === DATA_SCOPE_CUSTOM ? (
                <Form.Item
                  name="deptIds"
                  label={t("system.role.deptIds")}
                  rules={[{ required: true, message: t("system.role.deptIdsRequired") }]}
                >
                  <TreeSelect
                    treeData={deptTreeData}
                    multiple
                    treeCheckable
                    showSearch
                    treeDefaultExpandAll
                    treeNodeFilterProp="label"
                    placeholder={t("system.role.deptIdsPlaceholder")}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item
            name="status"
            label={t("common.status")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Radio.Group>
              <Radio value={CommonStatus.ENABLED}>{t("common.enabled")}</Radio>
              <Radio value={CommonStatus.DISABLED}>{t("common.disabled")}</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="sort" label={t("common.sort")}>
            <InputNumber min={0} className="w-120px" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

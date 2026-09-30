import { useEffect, useMemo, useState } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Checkbox,
  Collapse,
  Drawer,
  Form,
  Input,
  InputNumber,
  Radio,
  Segmented,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  TreeSelect,
  type TableProps,
} from "antd";
import {
  DeleteFilled,
  FileTextOutlined,
  FolderOpenOutlined,
  KeyOutlined,
  LinkOutlined,
  PlusCircleFilled,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import MenuAPI from "@/api/system/menu";
import type { MenuForm, MenuItem, MenuQueryParams, RouteParam } from "@/api/system/menu";
import Auth from "@/components/Auth";
import CopyButton from "@/components/CopyButton";
import IconSelect from "@/components/IconSelect";
import MenuIcon from "@/components/MenuIcon";
import RefreshButton from "@/components/RefreshButton";
import SectionTitle from "@/components/SectionTitle";
import { CommonStatus, MenuType } from "@/enums";
import {
  filterPageComponent,
  isViewComponent,
  normalizeViewPath,
  pageComponentTree,
} from "@/router/views";
import { usePermissionStore } from "@/stores/permission";
import { isValidURL, joinRoutePath } from "@/utils";
import { validateForm } from "@/utils/form";

import "./index.scss";

/** 顶级菜单的选项值，后端约定 0 表示顶级 */
const ROOT_PARENT_ID = "0";

/** 高级设置折叠面板的标识 */
const ADVANCED_PANEL = "advanced";

/** 外链打开方式 */
type ExternalMode = "blank" | "iframe";

/** 菜单类型对应的标签色 */
const MENU_TYPE_TAG_COLOR: Record<string, string> = {
  [MenuType.CATALOG]: "warning",
  [MenuType.MENU]: "success",
  [MenuType.EXTERNAL]: "processing",
  [MenuType.BUTTON]: "error",
};

/** 菜单类型选项，顺序即分段控件的展示顺序 */
const MENU_TYPE_OPTIONS = [
  { value: MenuType.MENU, labelKey: "system.menu.typeMenu", icon: <FileTextOutlined /> },
  { value: MenuType.CATALOG, labelKey: "system.menu.typeCatalog", icon: <FolderOpenOutlined /> },
  { value: MenuType.EXTERNAL, labelKey: "system.menu.typeExternal", icon: <LinkOutlined /> },
  { value: MenuType.BUTTON, labelKey: "system.menu.typeButton", icon: <KeyOutlined /> },
];

/** 新建菜单时的表单初始值 */
const INITIAL_FORM_DATA: MenuForm = {
  parentId: ROOT_PARENT_ID,
  visible: CommonStatus.ENABLED,
  type: MenuType.MENU,
  keepAlive: CommonStatus.ENABLED,
  params: [],
  generateCrudButtons: false,
};

/**
 * 树形选择节点
 */
interface TreeOption {
  value: string;
  label: string;
  disabled?: boolean;
  children?: TreeOption[];
}

/**
 * 判断状态是否为启用
 */
function isStatusEnabled(value?: number | boolean): boolean {
  return value === CommonStatus.ENABLED || value === true;
}

/**
 * 按访问地址生成路由名称
 * @param path 完整访问地址，如 /system/user
 */
function deriveRouteName(path: string): string {
  return path
    .split(/[/\-_]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

/**
 * 从菜单树中查找菜单及其祖先链
 * @param menus 菜单树
 * @param id 目标菜单 ID
 * @param trail 已遍历的祖先
 */
function findMenuTrail(menus: MenuItem[], id?: string, trail: MenuItem[] = []): MenuItem[] {
  if (!id) return [];

  for (const menu of menus) {
    const next = [...trail, menu];
    if (menu.id === id) return next;

    const hit = findMenuTrail(menu.children ?? [], id, next);
    if (hit.length) return hit;
  }

  return [];
}

/**
 * 从菜单树中查找菜单
 */
function findMenuById(menus: MenuItem[], id?: string): MenuItem | undefined {
  return findMenuTrail(menus, id).pop();
}

/**
 * 统计菜单及其子孙数量
 */
function countMenus(menus: MenuItem[]): number {
  return menus.reduce((total, menu) => total + 1 + countMenus(menu.children ?? []), 0);
}

/**
 * 判断菜单是否位于指定子树内（含自身）
 */
function isMenuInSubtree(root: MenuItem | undefined, targetId?: string): boolean {
  if (!root || !targetId) return false;
  if (root.id === targetId) return true;
  return (root.children ?? []).some((child) => isMenuInSubtree(child, targetId));
}

/**
 * 同级菜单的下一个排序值，让新增的菜单排在末尾
 */
function resolveNextSort(menus: MenuItem[], parentId: string): number {
  const siblings =
    parentId === ROOT_PARENT_ID ? menus : (findMenuById(menus, parentId)?.children ?? []);
  return siblings.reduce((max, item) => Math.max(max, item.sort ?? 0), 0) + 1;
}

/**
 * 同级页面已有按钮的权限模块名，取出现次数最多的那一段
 */
function resolveSiblingPermModule(menus: MenuItem[], parentId: string): string {
  const siblings =
    parentId === ROOT_PARENT_ID ? menus : (findMenuById(menus, parentId)?.children ?? []);
  const counter = new Map<string, number>();

  siblings.forEach((sibling) =>
    (sibling.children ?? []).forEach((child) => {
      if (child.type !== MenuType.BUTTON) return;
      const module = child.perm?.split(":")[0];
      if (module) counter.set(module, (counter.get(module) ?? 0) + 1);
    })
  );

  let module = "";
  let max = 0;
  counter.forEach((count, name) => {
    if (count > max) {
      max = count;
      module = name;
    }
  });

  return module;
}

interface ParamsFieldProps {
  /** 参数键值对 */
  value?: RouteParam[];
  /** 参数变更回调 */
  onChange?: (value: RouteParam[]) => void;
}

/** 路由参数编辑器 */
function ParamsField({ value = [], onChange }: ParamsFieldProps) {
  const { t } = useTranslation();

  /** 改写某一行的参数名或参数值 */
  function update(index: number, patch: Partial<RouteParam>) {
    onChange?.(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  if (value.length === 0) {
    return (
      <Button type="dashed" onClick={() => onChange?.([{ key: "", value: "" }])}>
        {t("system.menu.addParam")}
      </Button>
    );
  }

  return (
    <div className="menu-param-list">
      {value.map((item, index) => (
        <div className="menu-param-row" key={index}>
          <Input
            value={item.key}
            placeholder={t("system.menu.paramKey")}
            onChange={(event) => update(index, { key: event.target.value })}
          />
          <span className="menu-param-row__equal">=</span>
          <Input
            value={item.value}
            placeholder={t("system.menu.paramValue")}
            onChange={(event) => update(index, { value: event.target.value })}
          />
          {index === value.length - 1 && (
            <PlusCircleFilled
              className="menu-param-row__action is-add"
              onClick={() => onChange?.([...value, { key: "", value: "" }])}
            />
          )}
          <DeleteFilled
            className="menu-param-row__action is-delete"
            onClick={() => onChange?.(value.filter((_, i) => i !== index))}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * 菜单管理
 * 否则后端会收到上一轮填写残留的值
 */
export default function MenuList() {
  const { t } = useTranslation();
  const { message, modal } = AntdApp.useApp();

  const [searchForm] = Form.useForm<MenuQueryParams>();
  const [editForm] = Form.useForm<MenuForm>();

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<MenuItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<MenuForm>({ ...INITIAL_FORM_DATA });
  const [expandAll, setExpandAll] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  // 全量菜单树，供上级菜单选项、排序推算与层级校验使用
  const [parentMenuTree, setParentMenuTree] = useState<MenuItem[]>([]);
  const [componentManual, setComponentManual] = useState(false);
  // 编辑前的组件值，历史数据可能已无对应文件，不做存在性校验
  const [originalComponent, setOriginalComponent] = useState<string>();
  const [externalMode, setExternalMode] = useState<ExternalMode>("blank");
  const [advancedPanels, setAdvancedPanels] = useState<string[]>([ADVANCED_PANEL]);

  // 同级页面已有按钮的权限模块名，用于推导按钮权限前缀
  const [siblingPermModule, setSiblingPermModule] = useState("");
  // 按钮权限前缀是否由自动推导填入，用户手改后不再跟随访问路径
  const [permPrefixAuto, setPermPrefixAuto] = useState(false);

  const isEditing = Boolean(formData.id);
  const isTopLevel = !formData.parentId || formData.parentId === ROOT_PARENT_ID;
  const isCatalog = formData.type === MenuType.CATALOG;
  const isPage = formData.type === MenuType.MENU;
  const isExternal = formData.type === MenuType.EXTERNAL;
  const isButton = formData.type === MenuType.BUTTON;
  // 系统内嵌外链需要一个内部路由承载 iframe 页面
  const isEmbeddedExternal = isExternal && externalMode === "iframe";

  const showRoutePath = isCatalog || isPage || isEmbeddedExternal;
  const showKeepAlive = isPage || isEmbeddedExternal;
  const showRouteName = showKeepAlive && isStatusEnabled(formData.keepAlive);
  const showAdvanced = showKeepAlive || isCatalog || showRouteName;

  async function fetchList(params?: MenuQueryParams) {
    setLoading(true);
    try {
      const data = await MenuAPI.getList(params);
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

  /** 菜单变更后重建动态路由，让侧边栏与页面立即生效 */
  async function refreshUserRoutes() {
    try {
      await usePermissionStore.getState().reloadRoutes();
    } catch {
      // 重建失败不阻塞当前操作，刷新页面后会重新取
    }
  }

  const parentMenu = useMemo(
    () => findMenuById(parentMenuTree, formData.parentId),
    [parentMenuTree, formData.parentId]
  );

  // 按钮权限只能挂在页面下；已有菜单的类型不可修改
  const typeOptions = useMemo(() => {
    if (isEditing) return MENU_TYPE_OPTIONS;
    return parentMenu?.type === MenuType.MENU
      ? MENU_TYPE_OPTIONS.filter((item) => item.value === MenuType.BUTTON)
      : MENU_TYPE_OPTIONS.filter((item) => item.value !== MenuType.BUTTON);
  }, [isEditing, parentMenu]);

  const typeLocked = isEditing || typeOptions.length === 1;
  const typeLockedTip = isEditing
    ? t("system.menu.typeLockedEdit")
    : t("system.menu.typeLockedButton");

  // 上级路径逐级拼接，得到当前菜单的完整访问地址
  const parentPath = useMemo(
    () =>
      findMenuTrail(parentMenuTree, formData.parentId).reduce(
        (path, menu) => joinRoutePath(path, menu.routePath),
        ""
      ),
    [parentMenuTree, formData.parentId]
  );

  const fullRoutePath = formData.routePath ? joinRoutePath(parentPath, formData.routePath) : "";

  const derivedRouteName = fullRoutePath ? deriveRouteName(fullRoutePath) : "";

  // 页面路径对应的文件位置，输入带 .tsx 后缀也能正确展示
  const componentFilePath = formData.component
    ? `src/views/${normalizeViewPath(formData.component)}.tsx`
    : "";

  // 落位预览：说明当前配置在侧边栏的效果
  const previewText = useMemo(() => {
    const name = formData.name?.trim() || t("system.menu.unnamed");
    const position = isTopLevel
      ? t("system.menu.positionTop")
      : t("system.menu.positionUnder", { parent: parentMenu?.name ?? "" });

    if (isButton) {
      return t("system.menu.previewButton", {
        parent: parentMenu?.name ?? "",
        perm: formData.perm?.trim() || t("system.menu.pending"),
      });
    }

    if (isExternal) {
      return t("system.menu.previewExternal", {
        position,
        mode: isEmbeddedExternal ? t("system.menu.modeIframe") : t("system.menu.modeBlank"),
      });
    }

    if (isCatalog) {
      return t("system.menu.previewCatalog", { position, name });
    }

    return t("system.menu.previewPage", {
      position,
      name,
      address: fullRoutePath ? t("system.menu.addressTip", { path: fullRoutePath }) : "",
    });
  }, [
    formData.name,
    formData.perm,
    fullRoutePath,
    isButton,
    isCatalog,
    isEmbeddedExternal,
    isExternal,
    isTopLevel,
    parentMenu,
    t,
  ]);

  // 上级菜单选项：编辑时禁用自身及其下级，与当前类型不兼容的节点也禁用
  const parentTreeData = useMemo<TreeOption[]>(() => {
    const selfSubtreeRoot = findMenuById(parentMenuTree, formData.id);

    /** 递归把菜单树转为带禁用状态的选项树 */
    function build(menus: MenuItem[]): TreeOption[] {
      return menus.map((menu) => ({
        value: menu.id ?? "",
        label: menu.name ?? "",
        disabled:
          isMenuInSubtree(selfSubtreeRoot, menu.id) ||
          (isButton ? menu.type !== MenuType.MENU : menu.type === MenuType.MENU),
        children: menu.children?.length ? build(menu.children) : undefined,
      }));
    }

    return [
      {
        value: ROOT_PARENT_ID,
        label: t("system.menu.root"),
        disabled: isButton,
        children: build(parentMenuTree),
      },
    ];
  }, [formData.id, isButton, parentMenuTree, t]);

  // 表格里所有带子菜单的节点，展开全部时按它下发
  const allParentKeys = useMemo(() => {
    const keys: string[] = [];
    /** 递归收集带子级的菜单 ID */
    const walk = (rows: MenuItem[]) =>
      rows.forEach((row) => {
        if (row.id && row.children?.length) {
          keys.push(row.id);
          walk(row.children);
        }
      });

    walk(list);
    return keys;
  }, [list]);

  useEffect(() => {
    setExpandedRowKeys(expandAll ? allParentKeys : []);
  }, [expandAll, allParentKeys]);

  const typeSegmentedOptions = typeOptions.map((item) => ({
    value: item.value,
    label: (
      <span className="menu-type-control__option">
        {item.icon}
        <span>{t(item.labelKey)}</span>
      </span>
    ),
  }));

  /** 同时写入表单与本地镜像，派生字段都读镜像 */
  function patchForm(values: Partial<MenuForm>) {
    editForm.setFieldsValue(values);
    setFormData((prev) => ({ ...prev, ...values }));
  }

  /** 按钮权限前缀，由同级模块名与当前访问路径拼成 */
  function deriveButtonPermPrefix(routePath?: string): string {
    return [siblingPermModule, routePath?.trim()].filter(Boolean).join(":");
  }

  /** 菜单类型切换：清空类型专属字段并补默认值 */
  function handleTypeChange(type: MenuType) {
    const nextExternalMode: ExternalMode = "blank";
    setExternalMode(nextExternalMode);
    setPermPrefixAuto(false);

    patchForm({
      type,
      routeName: undefined,
      routePath: undefined,
      component: type === MenuType.EXTERNAL ? "" : undefined,
      externalUrl: undefined,
      redirect: undefined,
      perm: undefined,
      params: [],
      keepAlive: type === MenuType.MENU ? CommonStatus.ENABLED : undefined,
      generateCrudButtons: false,
      buttonPermPrefix: undefined,
    });

    editForm.setFields([{ name: "component", errors: [] }]);
  }

  /** 表单值变化：同步镜像并处理需要联动的字段 */
  function handleValuesChange(changed: Partial<MenuForm>) {
    const next: MenuForm = { ...formData, ...changed };
    setFormData(next);

    if ("buttonPermPrefix" in changed) setPermPrefixAuto(false);

    // 勾选生成按钮时按同级已有按钮推导权限前缀，用户已填则不覆盖
    if (changed.generateCrudButtons && !next.buttonPermPrefix?.trim()) {
      setPermPrefixAuto(true);
      patchForm({ buttonPermPrefix: deriveButtonPermPrefix(next.routePath) });
      return;
    }

    // 前缀是推导来的就跟随访问路径刷新，用户手改过则不再变动
    if ("routePath" in changed && permPrefixAuto) {
      patchForm({ buttonPermPrefix: deriveButtonPermPrefix(next.routePath) });
    }
  }

  /** 打开表单抽屉 */
  async function openDrawer(parentId?: string, menuId?: string) {
    // 拉全量菜单：上级选项与排序推算都要用完整数据，避免被搜索条件过滤
    const [allMenus, menuForm] = await Promise.all([
      MenuAPI.getList({}),
      menuId ? MenuAPI.getFormData(menuId) : Promise.resolve(null),
    ]);
    setParentMenuTree(allMenus ?? []);
    setDrawerOpen(true);

    editForm.resetFields();

    if (menuForm) {
      assignFormData(menuForm);
      return;
    }

    const nextParentId = parentId?.toString() ?? ROOT_PARENT_ID;
    const parent = findMenuById(allMenus ?? [], nextParentId);
    setSiblingPermModule(resolveSiblingPermModule(allMenus ?? [], nextParentId));

    assignFormData({
      ...INITIAL_FORM_DATA,
      parentId: nextParentId,
      sort: resolveNextSort(allMenus ?? [], nextParentId),
      // 页面下只能新增按钮权限
      type: parent?.type === MenuType.MENU ? MenuType.BUTTON : MenuType.MENU,
    });
  }

  /** 替换表单数据，避免上一次编辑残留字段 */
  function assignFormData(data: MenuForm) {
    const next: MenuForm = { ...INITIAL_FORM_DATA, ...data, params: data.params ?? [] };

    // 历史数据或手动输入可能带 .tsx 后缀、开头斜杠，统一规整后再回填
    if (next.component) next.component = normalizeViewPath(next.component);

    setComponentManual(Boolean(next.component) && !isViewComponent(next.component));
    setExternalMode(next.component === "iframe" ? "iframe" : "blank");
    setOriginalComponent(next.component);
    setAdvancedPanels([ADVANCED_PANEL]);
    setPermPrefixAuto(false);

    setFormData(next);
    editForm.setFieldsValue(next);
  }

  /** 关闭抽屉并重置表单 */
  function closeDrawer() {
    setDrawerOpen(false);
    setComponentManual(false);
    setOriginalComponent(undefined);
    setExternalMode("blank");
    setSiblingPermModule("");
    setFormData({ ...INITIAL_FORM_DATA });
    editForm.resetFields();
  }

  /** 切换外链打开方式：内嵌外链需要路由承载 */
  function handleExternalModeChange(mode: ExternalMode) {
    setExternalMode(mode);
    patchForm({
      component: mode === "iframe" ? "iframe" : "",
      keepAlive:
        mode === "iframe" ? (formData.keepAlive ?? CommonStatus.ENABLED) : formData.keepAlive,
    });
    editForm.setFields([{ name: "component", errors: [] }]);
  }

  /** 切换页面路径的录入方式 */
  function toggleComponentManual() {
    setComponentManual((prev) => !prev);
    editForm.setFields([{ name: "component", errors: [] }]);
  }

  /** 手动输入的页面路径失焦后统一格式：去掉开头的斜杠与 .tsx 后缀 */
  function handleComponentBlur() {
    if (!formData.component) return;
    patchForm({ component: normalizeViewPath(formData.component) });
    editForm.setFields([{ name: "component", errors: [] }]);
  }

  /** 按菜单类型清理无关字段 */
  function normalizePayload(): MenuForm {
    const payload: MenuForm = {
      ...formData,
      name: formData.name?.trim(),
      routeName: formData.routeName?.trim() || undefined,
      routePath: formData.routePath?.trim() || undefined,
      component: formData.component ? normalizeViewPath(formData.component) : undefined,
      externalUrl: formData.externalUrl?.trim() || undefined,
      redirect: formData.redirect?.trim() || undefined,
      params: formData.params?.filter((item) => item.key && item.value) ?? [],
      // 后端按 前缀:动作 拼接，去掉末尾冒号避免出现 sys:user::list
      buttonPermPrefix: formData.buttonPermPrefix?.trim().replace(/:+$/, "") || undefined,
    };

    if (isCatalog) {
      payload.routeName = undefined;
      payload.component = undefined;
      payload.externalUrl = undefined;
      payload.perm = undefined;
      payload.keepAlive = undefined;
      payload.params = [];
    }

    if (isPage) {
      payload.externalUrl = undefined;
      payload.redirect = undefined;
      payload.perm = undefined;
    }

    if (isExternal) {
      payload.perm = undefined;
      payload.redirect = undefined;
      payload.params = [];

      if (!isEmbeddedExternal) {
        // 新标签页：不需要路由名称、路径、缓存
        payload.routeName = undefined;
        payload.routePath = undefined;
        payload.component = undefined;
        payload.keepAlive = undefined;
      }
    }

    if (isButton) {
      payload.routeName = undefined;
      payload.routePath = undefined;
      payload.component = undefined;
      payload.externalUrl = undefined;
      payload.redirect = undefined;
      payload.icon = undefined;
      payload.keepAlive = undefined;
      payload.params = [];
    }

    // 按钮权限仅页面类型可选，其他类型不带
    if (!isPage) {
      payload.generateCrudButtons = undefined;
      payload.buttonPermPrefix = undefined;
    }

    // 路由名称用于程序内部定位页面，留空时按访问地址生成；关闭缓存时不下发
    if (payload.keepAlive && isStatusEnabled(payload.keepAlive)) {
      payload.routeName = payload.routeName || derivedRouteName;
    } else {
      payload.routeName = undefined;
    }

    return payload;
  }

  async function handleSubmit() {
    const values = await validateForm(editForm);
    if (!values) return;

    const selfMenu = findMenuById(parentMenuTree, formData.id);
    if (isMenuInSubtree(selfMenu, formData.parentId)) {
      message.error(t("system.menu.parentError"));
      return;
    }

    setSubmitting(true);
    try {
      const payload = normalizePayload();
      if (formData.id) {
        await MenuAPI.update(formData.id, payload);
      } else {
        await MenuAPI.create(payload);
      }
      message.success(t("common.saveSuccess"));
      closeDrawer();
      fetchList();
      refreshUserRoutes();
    } finally {
      setSubmitting(false);
    }
  }

  /** 删除菜单前提示会一并删除的子菜单数量 */
  function handleDelete(record: MenuItem) {
    if (!record.id) return;

    const childCount = countMenus(record.children ?? []);
    const childTip = childCount ? t("system.menu.deleteChildTip", { count: childCount }) : "";

    modal.confirm({
      title: t("common.tips"),
      content: t("system.menu.deleteConfirm", { name: record.name, childTip }),
      okButtonProps: { danger: true },
      onOk: async () => {
        await MenuAPI.deleteById(record.id as string);
        message.success(t("common.deleteSuccess"));
        fetchList();
        refreshUserRoutes();
      },
    });
  }

  /** 菜单的完整访问地址 */
  function getMenuAccessPath(record: MenuItem): string {
    if (record.type === MenuType.EXTERNAL) return record.externalUrl ?? "";
    if (record.type === MenuType.BUTTON) return "";
    return findMenuTrail(list, record.id).reduce(
      (path, menu) => joinRoutePath(path, menu.routePath),
      ""
    );
  }

  /** 菜单关联的页面路径 */
  function getMenuComponentPath(record: MenuItem): string {
    return record.type === MenuType.MENU ? (record.component ?? "") : "";
  }

  const columns: TableProps<MenuItem>["columns"] = [
    {
      title: t("system.menu.name"),
      dataIndex: "name",
      minWidth: 220,
      render: (name: string, record) => (
        <div className="menu-name-cell">
          <span
            className={`menu-name-cell__icon${
              !record.icon && record.type !== MenuType.BUTTON ? " is-default" : ""
            }`}
          >
            {record.type !== MenuType.BUTTON && <MenuIcon icon={record.icon || "menu"} />}
          </span>
          <span
            className={`menu-name-cell__text${
              record.type === MenuType.CATALOG ? " is-catalog" : ""
            }`}
          >
            {name}
          </span>
        </div>
      ),
    },
    {
      title: t("system.menu.type"),
      dataIndex: "type",
      width: 100,
      render: (type: string) => (
        <Tag color={MENU_TYPE_TAG_COLOR[type] ?? "default"}>
          {t(MENU_TYPE_OPTIONS.find((item) => item.value === type)?.labelKey ?? "")}
        </Tag>
      ),
    },
    {
      title: t("system.menu.routePath"),
      dataIndex: "routePath",
      minWidth: 200,
      render: (routePath: string, record) => {
        if (record.type === MenuType.EXTERNAL && record.externalUrl) {
          return (
            <div className="menu-address-cell">
              <a
                className="menu-address-cell__link"
                href={record.externalUrl}
                title={record.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {record.externalUrl}
              </a>
              <CopyButton text={record.externalUrl} />
            </div>
          );
        }

        const accessPath = getMenuAccessPath(record);
        return (
          <span className="menu-cell-ellipsis" title={accessPath}>
            {accessPath}
          </span>
        );
      },
    },
    {
      title: t("system.menu.component"),
      dataIndex: "component",
      minWidth: 180,
      render: (component: string, record) => (
        <span className="menu-cell-ellipsis" title={getMenuComponentPath(record)}>
          {getMenuComponentPath(record) || component}
        </span>
      ),
    },
    {
      title: t("system.menu.perm"),
      dataIndex: "perm",
      width: 200,
      ellipsis: true,
    },
    {
      title: t("common.status"),
      dataIndex: "visible",
      width: 90,
      render: (visible: number) =>
        visible === CommonStatus.ENABLED ? (
          <Tag color="success">{t("system.menu.visible")}</Tag>
        ) : (
          <Tag color="default">{t("system.menu.hidden")}</Tag>
        ),
    },
    { title: t("common.sort"), dataIndex: "sort", width: 80 },
    {
      title: t("common.operate"),
      key: "operate",
      width: 220,
      fixed: "right",
      render: (_, record) => (
        <Space size={0}>
          {(record.type === MenuType.CATALOG || record.type === MenuType.MENU) && (
            <Auth perm="sys:menu:create">
              <Button type="link" size="small" onClick={() => openDrawer(record.id)}>
                {record.type === MenuType.MENU
                  ? t("system.menu.createButton")
                  : t("system.menu.createChild")}
              </Button>
            </Auth>
          )}
          <Auth perm="sys:menu:update">
            <Button
              type="link"
              size="small"
              onClick={() => openDrawer(record.parentId ?? ROOT_PARENT_ID, record.id)}
            >
              {t("common.update")}
            </Button>
          </Auth>
          <Auth perm="sys:menu:delete">
            <Button type="link" size="small" danger onClick={() => handleDelete(record)}>
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
        <Form
          form={searchForm}
          layout="inline"
          onFinish={() => fetchList(searchForm.getFieldsValue())}
        >
          <Form.Item name="keywords">
            <Input placeholder={t("system.menu.name")} allowClear className="w-200px" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                {t("common.search")}
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  searchForm.resetFields();
                  fetchList();
                }}
              >
                {t("common.reset")}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card className="page-content">
        <div className="page-toolbar">
          <Space>
            <Auth perm="sys:menu:create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openDrawer(ROOT_PARENT_ID)}
              >
                {t("common.create")}
              </Button>
            </Auth>
          </Space>

          <Space>
            <Tooltip title={expandAll ? t("system.menu.collapseAll") : t("system.menu.expandAll")}>
              <Button
                icon={
                  <i className={expandAll ? "i-svg:checkbox-indeterminate" : "i-svg:add-box"} />
                }
                onClick={() => setExpandAll((prev) => !prev)}
              />
            </Tooltip>
            <RefreshButton onClick={fetchList} loading={loading} />
          </Space>
        </div>

        <Table<MenuItem>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          scroll={{ x: 1400 }}
          pagination={false}
          expandable={{
            expandedRowKeys,
            onExpandedRowsChange: (keys) => setExpandedRowKeys(keys.map(String)),
          }}
        />
      </Card>

      <Drawer
        title={formData.id ? t("common.update") : t("common.create")}
        width={600}
        open={drawerOpen}
        onClose={closeDrawer}
        footer={
          <Space className="flex-x-end">
            <Button onClick={closeDrawer}>{t("common.cancel")}</Button>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              {t("common.confirm")}
            </Button>
          </Space>
        }
      >
        <Form
          form={editForm}
          className="menu-form"
          labelCol={{ flex: "96px" }}
          wrapperCol={{ flex: "auto" }}
          initialValues={INITIAL_FORM_DATA}
          onValuesChange={handleValuesChange}
        >
          <Form.Item label={t("system.menu.type")} className="mb-3">
            <div className="menu-type-control">
              <Segmented
                block
                value={formData.type}
                options={typeSegmentedOptions}
                disabled={typeLocked}
                onChange={(value) => handleTypeChange(value as MenuType)}
              />
              {typeLocked && <div className="menu-form__tip">{typeLockedTip}</div>}
            </div>
          </Form.Item>

          <div className="menu-preview">
            <span className="menu-preview__icon">
              <i className="i-svg:menu" />
            </span>
            <span>{previewText}</span>
          </div>

          <SectionTitle title={t("system.menu.basicInfo")} />

          <Form.Item label={t("system.menu.name")} required>
            <div className="menu-form__field">
              <div className="menu-form__row">
                <Form.Item
                  name="name"
                  noStyle
                  rules={[{ required: true, message: t("common.required") }]}
                >
                  <Input placeholder={t("system.menu.namePlaceholder")} />
                </Form.Item>
              </div>
            </div>
          </Form.Item>

          <Form.Item
            name="parentId"
            label={t("system.menu.parent")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <TreeSelect
              treeData={parentTreeData}
              treeDefaultExpandAll
              showSearch
              treeNodeFilterProp="label"
              placeholder={t("system.menu.parentPlaceholder")}
            />
          </Form.Item>

          {showRoutePath && <SectionTitle title={t("system.menu.accessConfig")} />}

          {isExternal && (
            <>
              <Form.Item
                name="externalUrl"
                label={t("system.menu.externalUrl")}
                rules={[
                  {
                    validator: (_, value: string) => {
                      if (!isExternal) return Promise.resolve();
                      if (!value) return Promise.reject(new Error(t("common.required")));
                      // 站内路径（如 /data-screen）由前端补全当前站点域名
                      if (value.startsWith("/")) return Promise.resolve();
                      if (!isValidURL(value)) {
                        return Promise.reject(new Error(t("system.menu.externalUrlInvalid")));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="https://example.com 或站内路径 /data-screen" allowClear />
              </Form.Item>

              <Form.Item label={t("system.menu.openMode")}>
                <Radio.Group
                  value={externalMode}
                  onChange={(event) => handleExternalModeChange(event.target.value as ExternalMode)}
                >
                  <Radio value="blank">{t("system.menu.openBlank")}</Radio>
                  <Radio value="iframe">{t("system.menu.openIframe")}</Radio>
                </Radio.Group>
              </Form.Item>
            </>
          )}

          {showRoutePath && (
            <Form.Item
              required
              label={
                <span className="menu-form__label">
                  {t("system.menu.routePath")}
                  <Tooltip title={t("system.menu.routePathTip")}>
                    <QuestionCircleOutlined />
                  </Tooltip>
                </span>
              }
            >
              <div className="menu-form__field">
                <Form.Item
                  name="routePath"
                  noStyle
                  rules={[{ required: true, message: t("common.required") }]}
                >
                  <Input
                    placeholder={
                      isCatalog
                        ? t("system.menu.routePathPlaceholderCatalog")
                        : t("system.menu.routePathPlaceholderPage")
                    }
                  />
                </Form.Item>
                {fullRoutePath && (
                  <div className="menu-form__tip">
                    {t("system.menu.fullRoutePath")}
                    <span className="menu-form__path">{fullRoutePath}</span>
                  </div>
                )}
              </div>
            </Form.Item>
          )}

          {isPage && (
            <Form.Item
              required
              label={
                <span className="menu-form__label">
                  {t("system.menu.component")}
                  <Tooltip title={t("system.menu.componentTip")}>
                    <QuestionCircleOutlined />
                  </Tooltip>
                </span>
              }
            >
              <div className="menu-form__field">
                <div className="menu-form__row">
                  <Form.Item
                    name="component"
                    noStyle
                    rules={[
                      {
                        validator: (_, value: string) => {
                          if (!isPage) return Promise.resolve();
                          if (!value) {
                            return Promise.reject(
                              new Error(
                                componentManual
                                  ? t("system.menu.componentManualRequired")
                                  : t("common.required")
                              )
                            );
                          }
                          // 未改动的历史值跳过存在性校验，避免旧数据无法保存
                          if (value !== originalComponent && !isViewComponent(value)) {
                            return Promise.reject(new Error(t("system.menu.componentNotExist")));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    {componentManual ? (
                      <Input placeholder="system/user/index" onBlur={handleComponentBlur} />
                    ) : (
                      <TreeSelect
                        treeData={pageComponentTree}
                        treeDefaultExpandAll
                        showSearch
                        filterTreeNode={(input, node) =>
                          filterPageComponent(input, node as { label?: string; value?: string })
                        }
                        placeholder="system/user/index"
                      />
                    )}
                  </Form.Item>
                  <Button type="link" className="menu-form__switch" onClick={toggleComponentManual}>
                    {componentManual
                      ? t("system.menu.componentTree")
                      : t("system.menu.componentManual")}
                  </Button>
                </div>
                {formData.component && (
                  <div className="menu-form__tip">
                    <span className="menu-form__path">{componentFilePath}</span>
                  </div>
                )}
              </div>
            </Form.Item>
          )}

          {isButton && (
            <Form.Item
              name="perm"
              label={
                <span className="menu-form__label">
                  {t("system.menu.perm")}
                  <Tooltip title={t("system.menu.permTip")}>
                    <QuestionCircleOutlined />
                  </Tooltip>
                </span>
              }
              rules={[{ required: true, message: t("common.required") }]}
            >
              <Input placeholder={t("system.menu.permPlaceholder")} />
            </Form.Item>
          )}

          {!isButton && <SectionTitle title={t("system.menu.displayConfig")} />}

          {!isButton && (
            <Form.Item label={t("system.menu.sidebarVisible")}>
              <Switch
                checked={formData.visible !== CommonStatus.DISABLED}
                onChange={(checked) =>
                  patchForm({
                    visible: checked ? CommonStatus.ENABLED : CommonStatus.DISABLED,
                  })
                }
              />
            </Form.Item>
          )}

          {!isButton && (
            <Form.Item name="icon" label={t("system.menu.icon")}>
              <IconSelect />
            </Form.Item>
          )}

          <Form.Item name="sort" label={t("common.sort")}>
            <InputNumber min={0} className="w-120px" />
          </Form.Item>

          {showAdvanced && (
            <Collapse
              className="menu-form__advanced"
              activeKey={advancedPanels}
              onChange={(keys) => setAdvancedPanels(keys as string[])}
              items={[
                {
                  key: ADVANCED_PANEL,
                  label: t("system.menu.advanced"),
                  children: (
                    <>
                      {showKeepAlive && (
                        <Form.Item label={t("system.menu.keepAlive")}>
                          <Radio.Group
                            value={formData.keepAlive}
                            onChange={(event) => patchForm({ keepAlive: event.target.value })}
                          >
                            <Radio value={CommonStatus.ENABLED}>{t("common.enabled")}</Radio>
                            <Radio value={CommonStatus.DISABLED}>{t("common.disabled")}</Radio>
                          </Radio.Group>
                        </Form.Item>
                      )}

                      {showRouteName && (
                        <Form.Item
                          name="routeName"
                          label={
                            <span className="menu-form__label">
                              {t("system.menu.routeName")}
                              <Tooltip title={t("system.menu.routeNameTip")}>
                                <QuestionCircleOutlined />
                              </Tooltip>
                            </span>
                          }
                        >
                          <Input placeholder={derivedRouteName || "SystemUser"} />
                        </Form.Item>
                      )}

                      {isPage && (
                        <Form.Item
                          label={
                            <span className="menu-form__label">
                              {t("system.menu.params")}
                              <Tooltip title={t("system.menu.paramsTip")}>
                                <QuestionCircleOutlined />
                              </Tooltip>
                            </span>
                          }
                        >
                          <Form.Item name="params" noStyle>
                            <ParamsField />
                          </Form.Item>
                        </Form.Item>
                      )}

                      {isCatalog && (
                        <Form.Item name="redirect" label={t("system.menu.redirect")}>
                          <Input placeholder={t("system.menu.redirectTip")} />
                        </Form.Item>
                      )}

                      {isPage && !isEditing && (
                        <Form.Item label={t("system.menu.generateCrudButtons")}>
                          <div className="menu-form__field">
                            <Form.Item name="generateCrudButtons" valuePropName="checked" noStyle>
                              <Checkbox>{t("system.menu.generateCrudButtons")}</Checkbox>
                            </Form.Item>
                            {formData.generateCrudButtons && (
                              <Input
                                className="menu-form__prefix"
                                value={formData.buttonPermPrefix}
                                placeholder={t("system.menu.buttonPermPrefixPlaceholder")}
                                onChange={(event) =>
                                  patchForm({ buttonPermPrefix: event.target.value })
                                }
                              />
                            )}
                          </div>
                        </Form.Item>
                      )}
                    </>
                  ),
                },
              ]}
            />
          )}
        </Form>
      </Drawer>
    </div>
  );
}

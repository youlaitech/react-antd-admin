/**
 * 后端返回的路由项
 */
export interface RouteItem {
  /** 子路由列表 */
  children?: RouteItem[];
  /** 组件路径，"Layout" 表示管理端布局 */
  component?: string;
  /** 路由名称 */
  name?: string;
  /** 路由路径 */
  path?: string;
  /** 路由属性 */
  meta?: Meta;
  /** 跳转链接 */
  redirect?: string;
}

/**
 * 路由属性
 */
export interface Meta {
  /** 是否隐藏(true-是 false-否) */
  hidden?: boolean;
  /** ICON */
  icon?: string;
  /** 【菜单】是否开启页面缓存 */
  keepAlive?: boolean;
  /** 路由参数 */
  params?: Record<string, unknown>;
  /** 外链地址 */
  externalUrl?: string;
  /** 角色集合 */
  roles?: string[];
  /** 路由title */
  title?: string;
}

/**
 * 路由参数键值对
 */
export interface RouteParam {
  /** 参数名 */
  key?: string;
  /** 参数值 */
  value?: string;
}

/**
 * 菜单查询参数
 */
export interface MenuQueryParams {
  /** 关键字(菜单名称) */
  keywords?: string;
}

/**
 * 菜单列表项
 */
export interface MenuItem {
  /** 菜单ID */
  id?: string;
  /** 父级菜单ID */
  parentId?: string;
  /** 菜单名称 */
  name?: string;
  /** 菜单类型(C-目录 M-菜单 E-外链 B-按钮) */
  type?: string;
  /** 路由路径 */
  routePath?: string;
  /** 路由名称 */
  routeName?: string;
  /** 页面组件 */
  component?: string;
  /** 外链地址 */
  externalUrl?: string;
  /** 权限标识 */
  perm?: string;
  /** 图标 */
  icon?: string;
  /** 排序 */
  sort?: number;
  /** 显示状态(1-显示 0-隐藏) */
  visible?: number;
  /** 菜单范围(1=平台 2=业务) */
  scope?: number;
  /** 是否开启页面缓存 */
  keepAlive?: number | boolean;
  /** 默认跳转地址 */
  redirect?: string;
  /** 路由参数 */
  params?: RouteParam[];
  /** 子菜单 */
  children?: MenuItem[];
}

/**
 * 菜单表单
 */
export interface MenuForm {
  /** 菜单ID */
  id?: string;
  /** 父级菜单ID */
  parentId?: string;
  /** 菜单名称 */
  name?: string;
  /** 菜单类型 */
  type?: string;
  /** 路由路径 */
  routePath?: string;
  /** 路由名称 */
  routeName?: string;
  /** 页面组件 */
  component?: string;
  /** 外链地址 */
  externalUrl?: string;
  /** 权限标识 */
  perm?: string;
  /** 图标 */
  icon?: string;
  /** 排序 */
  sort?: number;
  /** 显示状态 */
  visible?: number;
  /** 菜单范围(1=平台 2=业务) */
  scope?: number;
  /** 是否开启页面缓存 */
  keepAlive?: number | boolean;
  /** 默认跳转地址 */
  redirect?: string;
  /** 路由参数 */
  params?: RouteParam[];
  /** 新增页面菜单时是否生成增删改查按钮 */
  generateCrudButtons?: boolean;
  /** 按钮权限标识前缀，如 sys:user */
  buttonPermPrefix?: string;
}

/**
 * AI 推断的菜单配置
 */
export interface MenuAiResult {
  /** 访问路径 */
  routePath?: string;
  /** 权限标识 */
  perm?: string;
  /** 建议的图标关键词，按贴切程度排列 */
  iconKeywords?: string[];
}

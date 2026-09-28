/**
 * 通用启用/禁用状态
 */
export enum CommonStatus {
  /** 禁用 */
  DISABLED = 0,
  /** 启用 */
  ENABLED = 1,
}

/**
 * 菜单类型
 */
export enum MenuType {
  /** 目录 */
  CATALOG = "C",
  /** 菜单 */
  MENU = "M",
  /** 外链 */
  EXTERNAL = "E",
  /** 按钮 */
  BUTTON = "B",
}

/**
 * 菜单范围，多租户开启时生效
 */
export enum MenuScope {
  /** 平台 */
  PLATFORM = 1,
  /** 业务 */
  TENANT = 2,
}

/**
 * 用户性别
 */
export enum UserGender {
  /** 未知 */
  UNKNOWN = 0,
  /** 男 */
  MALE = 1,
  /** 女 */
  FEMALE = 2,
}

/**
 * 动态表单状态（正数为有效生命周期，-1 为退役态）
 */
export enum FormStatus {
  /** 草稿 */
  DRAFT = 0,
  /** 已发布 */
  PUBLISHED = 1,
  /** 已停用 */
  DISABLED = -1,
}

/**
 * 动态表单类型
 */
export enum FormCategory {
  /** 普通表单：公开收集或挂菜单 */
  NORMAL = "normal",
  /** 工作流表单：可被流程绑定为发起或办理表单 */
  WORKFLOW = "workflow",
}

/**
 * 通知发布状态
 */
export enum NoticePublishStatus {
  /** 已撤回 */
  REVOKED = -1,
  /** 未发布 */
  DRAFT = 0,
  /** 已发布 */
  PUBLISHED = 1,
}

/**
 * 通知目标类型
 */
export enum NoticeTargetType {
  /** 全体 */
  ALL = 1,
  /** 指定用户 */
  SPECIFIED = 2,
}

/**
 * 操作日志状态
 */
export enum LogStatus {
  /** 失败 */
  FAIL = 0,
  /** 成功 */
  SUCCESS = 1,
}

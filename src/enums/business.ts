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

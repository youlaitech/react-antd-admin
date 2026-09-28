/**
 * 应用前缀，用于本地存储 key 命名空间
 */
export const APP_PREFIX = "raa";

/**
 * 本地存储 key
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: `${APP_PREFIX}:access_token`,
  REFRESH_TOKEN: `${APP_PREFIX}:refresh_token`,
  REMEMBER_ME: `${APP_PREFIX}:remember_me`,
  APP_SETTINGS: `${APP_PREFIX}:app_settings`,
  TAGS_VIEW: `${APP_PREFIX}:tags_view`,
  TENANT_ID: `${APP_PREFIX}:tenant_id`,
  TENANT_INFO: `${APP_PREFIX}:tenant_info`,
} as const;

/**
 * 超级管理员角色标识，拥有全部权限
 */
export const ROLE_ROOT = "ROOT";

/** 平台租户 ID */
export const PLATFORM_TENANT_ID = 0;

/**
 * 登录页路径
 */
export const LOGIN_PATH = "/login";

/**
 * 登录后的默认首页
 */
export const HOME_PATH = "/dashboard";

/** 公开表单分享页路径前缀 */
export const FORM_SHARE_PATH = "/f";

/** 免登录访问的路由白名单 */
export const WHITE_LIST = [LOGIN_PATH, "/404", FORM_SHARE_PATH];

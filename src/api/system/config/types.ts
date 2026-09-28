import type { BaseQueryParams } from "@/api/common";

/**
 * 系统配置查询参数
 */
export interface ConfigQueryParams extends BaseQueryParams {
  /** 关键字(配置键/配置名称) */
  keywords?: string;
}

/**
 * 系统配置列表项
 */
export interface ConfigItem {
  /** 配置ID */
  id?: string;
  /** 配置名称 */
  configName?: string;
  /** 配置键 */
  configKey?: string;
  /** 配置值 */
  configValue?: string;
  /** 描述 */
  remark?: string;
}

/**
 * 系统配置表单
 */
export interface ConfigForm {
  /** 配置ID */
  id?: string;
  /** 配置名称 */
  configName?: string;
  /** 配置键 */
  configKey?: string;
  /** 配置值 */
  configValue?: string;
  /** 描述 */
  remark?: string;
}

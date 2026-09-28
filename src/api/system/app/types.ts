import type { BaseQueryParams } from "@/api/common";

/**
 * 三方平台
 */
export type AppPlatform = "WECHAT_MP" | "WECHAT_MINI" | "ALIPAY" | "APPLE" | "QQ";

/**
 * 应用分页查询参数
 */
export interface AppQueryParams extends BaseQueryParams {
  /** 关键字(应用名称/应用编码/AppId) */
  keywords?: string;
  /** 状态(1-正常 0-禁用) */
  status?: number;
  /** 平台 */
  platform?: string;
}

/**
 * 应用表单
 */
export interface AppForm {
  /** 应用ID */
  id?: string;
  /** 应用名称 */
  appName: string;
  /** 应用编码 */
  appCode: string;
  /** 平台(WECHAT_MP / WECHAT_MINI / ALIPAY / APPLE / QQ) */
  platform: string;
  /** 微信/平台 AppId */
  appId: string;
  /** AppSecret */
  appSecret?: string;
  /** 商户号 */
  merchantId?: string;
  /** 商户密钥 */
  merchantKey?: string;
  /** 状态(1-正常 0-禁用) */
  status?: number;
  /** 备注 */
  remark?: string;
  /** 租户ID(平台级配置，默认 0) */
  tenantId?: string;
}

/**
 * 应用列表项
 */
export interface AppItem extends AppForm {
  id?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  isDeleted?: number;
}

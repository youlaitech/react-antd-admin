import type { BaseQueryParams } from "@/api/common";

/**
 * 操作日志查询参数
 */
export interface LogQueryParams extends BaseQueryParams {
  /** 关键字(IP/操作人) */
  keywords?: string;
  /** 操作时间范围 */
  createTime?: [string, string];
}

/**
 * 操作日志列表项
 */
export interface LogItem {
  /** 日志ID */
  id: number;
  /** 所属模块 */
  module?: string;
  /** 操作类型 */
  actionType?: string;
  /** 操作标题 */
  title?: string;
  /** 操作内容 */
  content?: string;
  /** 操作人ID */
  operatorId?: number;
  /** 操作人 */
  operatorName?: string;
  /** 请求路径 */
  requestUri?: string;
  /** 请求方法 */
  requestMethod?: string;
  /** IP地址 */
  ip?: string;
  /** 归属地 */
  region?: string;
  /** 设备 */
  device?: string;
  /** 浏览器 */
  browser?: string;
  /** 操作系统 */
  os?: string;
  /** 状态(0-失败 1-成功) */
  status?: number;
  /** 执行时间(毫秒) */
  executionTime?: number;
  /** 错误信息 */
  errorMsg?: string;
  /** 操作时间 */
  createTime?: string;
}



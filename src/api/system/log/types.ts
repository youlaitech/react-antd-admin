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

/**
 * 访问趋势查询参数
 */
export interface VisitTrendQueryParams {
  /** 开始日期 */
  startDate: string;
  /** 结束日期 */
  endDate: string;
}

/**
 * 访问趋势
 */
export interface VisitTrendDetail {
  /** 日期列表 */
  dates: string[];
  /** 浏览量(PV)列表 */
  pvList: number[];
  /** 访客数(UV)列表 */
  uvList: number[];
}

/**
 * 访问概览
 */
export interface VisitOverviewDetail {
  /** 今日独立访客数(UV) */
  todayUvCount: number;
  /** 累计独立访客数(UV) */
  totalUvCount: number;
  /** 独立访客增长率 */
  uvGrowthRate: number;
  /** 今日页面浏览量(PV) */
  todayPvCount: number;
  /** 累计页面浏览量(PV) */
  totalPvCount: number;
  /** 页面浏览量增长率 */
  pvGrowthRate: number;
}

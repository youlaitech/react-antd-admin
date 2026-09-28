import type { BaseQueryParams } from "@/api/common";

/**
 * 通知公告查询参数
 */
export interface NoticeQueryParams extends BaseQueryParams {
  /** 通知标题 */
  title?: string;
  /** 发布状态(0-未发布 1-已发布 -1-已撤回) */
  publishStatus?: number;
  /** 是否已读(0-未读 1-已读) */
  isRead?: number;
}

/**
 * 通知公告列表项
 */
export interface NoticeItem {
  /** 通知ID */
  id: string;
  /** 通知标题 */
  title: string;
  /** 通知内容 */
  content: string;
  /** 通知类型，取 notice_type 字典 */
  type: number;
  /** 通知等级，取 notice_level 字典 */
  level: string;
  /** 发布状态(0-未发布 1-已发布 -1-已撤回) */
  publishStatus: number;
  /** 是否已读(0-未读 1-已读) */
  isRead: number;
  /** 目标类型(1-全体 2-指定用户) */
  targetType?: number;
  /** 发布人 */
  publisherName?: string;
  /** 创建时间 */
  createTime?: string;
  /** 发布时间 */
  publishTime?: string;
  /** 撤回时间 */
  revokeTime?: string;
}

/**
 * 通知公告表单
 */
export interface NoticeForm {
  /** 通知ID */
  id?: string;
  /** 通知标题 */
  title?: string;
  /** 通知内容 */
  content?: string;
  /** 通知类型 */
  type?: number;
  /** 通知等级 */
  level?: string;
  /** 状态 */
  status?: number;
  /** 目标用户ID集合 */
  targetUsers?: number[];
  /** 目标类型(1-全体 2-指定用户) */
  targetType?: number;
}

/**
 * 通知公告详情
 */
export interface NoticeDetail {
  /** 通知ID */
  id?: string;
  /** 通知标题 */
  title?: string;
  /** 通知内容 */
  content?: string;
  /** 通知类型 */
  type?: number;
  /** 通知等级 */
  level?: string;
  /** 发布状态 */
  publishStatus?: number;
  /** 目标用户ID，后端以逗号分隔的字符串返回 */
  targetUserIds?: string;
  /** 发布人 */
  publisherName?: string;
  /** 发布时间 */
  publishTime?: string;
}

import type { BaseQueryParams } from "@/api/common";

/**
 * 字典标签样式，与后端码值解码后的前端取值
 */
export type DictTagType = "primary" | "success" | "warning" | "info" | "danger" | "";

/**
 * 字典分页查询参数
 */
export interface DictTypeQueryParams extends BaseQueryParams {
  /** 关键字(字典名称/编码) */
  keywords?: string;
  /** 状态(1-启用 0-禁用) */
  status?: number;
}

/**
 * 字典列表项
 */
export interface DictTypeItem {
  /** 字典ID */
  id: string;
  /** 字典名称 */
  name: string;
  /** 字典编码 */
  dictCode: string;
  /** 状态(1-启用 0-禁用) */
  status: number;
}

/**
 * 字典表单
 */
export interface DictTypeForm {
  /** 字典ID */
  id?: string;
  /** 字典名称 */
  name?: string;
  /** 字典编码 */
  dictCode?: string;
  /** 状态(1-启用 0-禁用) */
  status?: number;
  /** 备注 */
  remark?: string;
}

/**
 * 字典项分页查询参数
 */
export interface DictItemQueryParams extends BaseQueryParams {
  /** 关键字(字典标签/字典值) */
  keywords?: string;
  /** 字典编码 */
  dictCode?: string;
}

/**
 * 字典项列表项
 */
export interface DictItem {
  /** 字典项ID */
  id: string;
  /** 字典编码 */
  dictCode: string;
  /** 字典项标签 */
  label: string;
  /** 字典项值 */
  value: string;
  /** 状态(1-启用 0-禁用) */
  status: number;
  /** 排序 */
  sort?: number;
  /** 标签样式，后端返回码值，取用前已解码 */
  tagType?: DictTagType;
}

/**
 * 字典项表单
 */
export interface DictItemForm {
  /** 字典项ID */
  id?: string;
  /** 字典编码 */
  dictCode?: string;
  /** 字典项标签 */
  label?: string;
  /** 字典项值 */
  value?: string;
  /** 状态(1-启用 0-禁用) */
  status?: number;
  /** 排序 */
  sort?: number;
  /** 标签样式 */
  tagType?: DictTagType;
}

/**
 * 字典项选项
 */
export interface DictItemOption {
  /** 字典项值 */
  value: number | string;
  /** 字典项标签 */
  label: string;
  /** 标签样式 */
  tagType?: DictTagType;
}

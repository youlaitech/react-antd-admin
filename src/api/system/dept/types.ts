import type { BaseQueryParams } from "@/api/common";

/**
 * 部门查询参数
 */
export interface DeptQueryParams extends BaseQueryParams {
  /** 关键字(部门名称) */
  keywords?: string;
  /** 状态(1-启用 0-禁用) */
  status?: number;
}

/**
 * 部门列表项
 */
export interface DeptItem {
  /** 部门ID */
  id?: string;
  /** 部门名称 */
  name?: string;
  /** 部门编号 */
  code?: string;
  /** 父级部门ID */
  parentId?: string;
  /** 显示排序 */
  sort?: number;
  /** 状态(1-启用 0-禁用) */
  status?: number;
  /** 子部门 */
  children?: DeptItem[];
}

/**
 * 部门表单
 */
export interface DeptForm {
  /** 部门ID */
  id?: string;
  /** 部门名称 */
  name?: string;
  /** 部门编号 */
  code?: string;
  /** 父级部门ID */
  parentId?: string;
  /** 显示排序 */
  sort?: number;
  /** 状态(1-启用 0-禁用) */
  status?: number;
}

import type { BaseQueryParams } from "@/api/common";

/**
 * 角色分页查询参数
 */
export interface RoleQueryParams extends BaseQueryParams {
  /** 搜索关键字 */
  keywords?: string;
}

/**
 * 角色分页对象
 */
export interface RoleItem {
  /** 角色ID */
  id?: string;
  /** 角色编码 */
  code?: string;
  /** 角色名称 */
  name?: string;
  /** 排序 */
  sort?: number;
  /** 角色状态(1:启用;0:禁用) */
  status?: number;
  /** 数据权限(1-所有数据 2-部门及子部门数据 3-本部门数据 4-本人数据 5-自定义部门数据) */
  dataScope?: number;
  /** 数据权限标签 */
  dataScopeLabel?: string;
  /** 修改时间 */
  updateTime?: string;
}

/**
 * 角色表单
 */
export interface RoleForm {
  /** 角色ID */
  id?: string;
  /** 角色编码 */
  code?: string;
  /** 角色名称 */
  name?: string;
  /** 排序 */
  sort?: number;
  /** 角色状态(1:启用;0:禁用) */
  status?: number;
  /** 数据权限(1-所有数据 2-部门及子部门数据 3-本部门数据 4-本人数据 5-自定义部门数据) */
  dataScope?: number;
  /** 自定义数据权限的部门 ID 列表，dataScope=5 时有效 */
  deptIds?: string[];
  /** 备注 */
  remark?: string;
}

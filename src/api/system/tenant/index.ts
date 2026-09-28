import request from "@/utils/request";
import type { PageResult } from "@/api/common";
import type {
  TenantCreateForm,
  TenantCreateResult,
  TenantForm,
  TenantInfo,
  TenantItem,
  TenantQueryParams,
} from "./types";

const TENANT_BASE_URL = "/api/v1/tenants";

const TenantAPI = {
  /** 获取当前用户可访问的租户列表 */
  getTenantList() {
    return request<TenantInfo[]>({
      url: `${TENANT_BASE_URL}/options`,
      method: "get",
    });
  },

  /** 获取当前租户信息 */
  getCurrentTenant() {
    return request<TenantInfo>({
      url: `${TENANT_BASE_URL}/current`,
      method: "get",
    });
  },

  /** 切换租户 */
  switchTenant(tenantId: number) {
    return request<TenantInfo>({
      url: `${TENANT_BASE_URL}/${tenantId}/switch`,
      method: "post",
    });
  },

  /** 获取租户分页列表(平台租户管理) */
  getPage(queryParams?: TenantQueryParams) {
    return request<PageResult<TenantItem>>({
      url: TENANT_BASE_URL,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取租户表单数据 */
  getFormData(tenantId: string) {
    return request<TenantForm>({
      url: `${TENANT_BASE_URL}/${tenantId}/form`,
      method: "get",
    });
  },

  /** 新增租户并初始化默认数据 */
  create(data: TenantCreateForm) {
    return request<TenantCreateResult>({
      url: TENANT_BASE_URL,
      method: "post",
      data,
    });
  },

  /** 修改租户 */
  update(tenantId: string, data: TenantForm) {
    return request({
      url: `${TENANT_BASE_URL}/${tenantId}`,
      method: "put",
      data,
    });
  },

  /** 批量删除租户，多个以英文逗号(,)分割 */
  deleteByIds(ids: string) {
    return request({
      url: `${TENANT_BASE_URL}/${ids}`,
      method: "delete",
    });
  },

  /** 修改租户状态 */
  updateStatus(tenantId: string, status: number) {
    return request({
      url: `${TENANT_BASE_URL}/${tenantId}/status`,
      method: "put",
      params: { status },
    });
  },

  /** 获取租户菜单 ID 集合 */
  getTenantMenuIds(tenantId: number) {
    return request<number[]>({
      url: `${TENANT_BASE_URL}/${tenantId}/menuIds`,
      method: "get",
    });
  },

  /** 更新租户菜单 */
  updateTenantMenus(tenantId: number, menuIds: number[]) {
    return request({
      url: `${TENANT_BASE_URL}/${tenantId}/menus`,
      method: "put",
      data: menuIds,
    });
  },
};

export default TenantAPI;

// 重导出类型
export * from "./types";

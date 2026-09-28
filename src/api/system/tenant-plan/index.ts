import request from "@/utils/request";
import type { OptionItem, PageResult } from "@/api/common";
import type { TenantPlanForm, TenantPlanItem, TenantPlanQueryParams } from "./types";

const TENANT_PLAN_BASE_URL = "/api/v1/tenant-plans";

const TenantPlanAPI = {
  /** 获取租户套餐分页列表 */
  getPage(queryParams?: TenantPlanQueryParams) {
    return request<PageResult<TenantPlanItem>>({
      url: TENANT_PLAN_BASE_URL,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取租户套餐表单数据 */
  getFormData(planId: string) {
    return request<TenantPlanForm>({
      url: `${TENANT_PLAN_BASE_URL}/${planId}/form`,
      method: "get",
    });
  },

  /** 新增租户套餐 */
  create(data: TenantPlanForm) {
    return request({
      url: TENANT_PLAN_BASE_URL,
      method: "post",
      data,
    });
  },

  /** 修改租户套餐 */
  update(planId: string, data: TenantPlanForm) {
    return request({
      url: `${TENANT_PLAN_BASE_URL}/${planId}`,
      method: "put",
      data,
    });
  },

  /** 批量删除租户套餐，多个以英文逗号(,)分割 */
  deleteByIds(ids: string) {
    return request({
      url: `${TENANT_PLAN_BASE_URL}/${ids}`,
      method: "delete",
    });
  },

  /** 获取租户套餐下拉选项 */
  getOptions() {
    return request<OptionItem[]>({
      url: `${TENANT_PLAN_BASE_URL}/options`,
      method: "get",
    });
  },

  /** 获取套餐菜单 ID 集合 */
  getPlanMenuIds(planId: number) {
    return request<number[]>({
      url: `${TENANT_PLAN_BASE_URL}/${planId}/menuIds`,
      method: "get",
    });
  },

  /** 更新套餐菜单 */
  updatePlanMenus(planId: number, menuIds: number[]) {
    return request({
      url: `${TENANT_PLAN_BASE_URL}/${planId}/menus`,
      method: "put",
      data: menuIds,
    });
  },
};

export default TenantPlanAPI;

// 重导出类型
export * from "./types";

import request from "@/utils/request";
import type { PageResult } from "@/api/common";
import type { AppForm, AppItem, AppQueryParams } from "./types";

const APP_BASE_URL = "/api/v1/apps";

const AppAPI = {
  /** 获取应用分页列表 */
  getPage(queryParams?: AppQueryParams) {
    return request<PageResult<AppItem>>({
      url: APP_BASE_URL,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取应用表单数据 */
  getFormData(id: string) {
    return request<AppForm>({
      url: `${APP_BASE_URL}/${id}/form`,
      method: "get",
    });
  },

  /** 新增应用 */
  create(data: AppForm) {
    return request({
      url: APP_BASE_URL,
      method: "post",
      data,
    });
  },

  /** 修改应用 */
  update(id: string, data: AppForm) {
    return request({
      url: `${APP_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /** 批量删除应用，多个以英文逗号(,)分割 */
  deleteByIds(ids: string) {
    return request({
      url: `${APP_BASE_URL}/${ids}`,
      method: "delete",
    });
  },

  /** 修改应用状态 */
  updateStatus(id: string, status: number) {
    return request({
      url: `${APP_BASE_URL}/${id}/status`,
      method: "put",
      data: { status },
    });
  },
};

export default AppAPI;

// 重导出类型
export * from "./types";

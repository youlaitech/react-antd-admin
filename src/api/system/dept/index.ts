import request from "@/utils/request";
import type { OptionItem } from "@/api/common";
import type { DeptForm, DeptItem, DeptQueryParams } from "./types";

const DEPT_BASE_URL = "/api/v1/depts";

const DeptAPI = {
  /** 获取部门列表(树形) */
  getList(queryParams?: DeptQueryParams) {
    return request<DeptItem[]>({
      url: `${DEPT_BASE_URL}`,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取部门下拉选项(树形) */
  getOptions() {
    return request<OptionItem[]>({
      url: `${DEPT_BASE_URL}/options`,
      method: "get",
    });
  },

  /** 获取部门表单数据 */
  getFormData(id: string) {
    return request<DeptForm>({
      url: `${DEPT_BASE_URL}/${id}/form`,
      method: "get",
    });
  },

  /** 新增部门 */
  create(data: DeptForm) {
    return request({
      url: `${DEPT_BASE_URL}`,
      method: "post",
      data,
    });
  },

  /** 修改部门 */
  update(id: string, data: DeptForm) {
    return request({
      url: `${DEPT_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /** 批量删除部门，多个以英文逗号(,)分割 */
  deleteByIds(ids: string) {
    return request({
      url: `${DEPT_BASE_URL}/${ids}`,
      method: "delete",
    });
  },
};

export default DeptAPI;

// 重导出类型
export * from "./types";

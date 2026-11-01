import request from "@/utils/request";
import type { PageResult } from "@/api/common";
import type { ConfigForm, ConfigItem, ConfigQueryParams } from "./types";

const CONFIG_BASE_URL = "/api/v1/configs";

const ConfigAPI = {
  /**
   * 获取系统配置分页列表
   */
  getPage(queryParams: ConfigQueryParams) {
    return request<PageResult<ConfigItem>>({
      url: `${CONFIG_BASE_URL}`,
      method: "get",
      params: queryParams,
    });
  },

  /**
   * 获取系统配置表单数据
   */
  getFormData(id: string) {
    return request<ConfigForm>({
      url: `${CONFIG_BASE_URL}/${id}/form`,
      method: "get",
    });
  },

  /**
   * 新增系统配置
   */
  create(data: ConfigForm) {
    return request({
      url: `${CONFIG_BASE_URL}`,
      method: "post",
      data,
    });
  },

  /**
   * 修改系统配置
   */
  update(id: string, data: ConfigForm) {
    return request({
      url: `${CONFIG_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /**
   * 删除系统配置
   */
  deleteById(id: string) {
    return request({
      url: `${CONFIG_BASE_URL}/${id}`,
      method: "delete",
    });
  },

  /**
   * 刷新系统配置缓存
   */
  refreshCache() {
    return request({
      url: `${CONFIG_BASE_URL}/refresh`,
      method: "put",
    });
  },
};

export default ConfigAPI;

// 重导出类型
export * from "./types";

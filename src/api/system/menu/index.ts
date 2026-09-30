import request from "@/utils/request";
import type { OptionItem } from "@/api/common";
import { MenuType } from "@/enums";
import type { MenuForm, MenuItem, MenuQueryParams, RouteItem } from "./types";

const MENU_BASE_URL = "/api/v1/menus";

const MenuAPI = {
  /** 获取当前用户的路由列表 */
  getRoutes() {
    return request<RouteItem[]>({
      url: `${MENU_BASE_URL}/routes`,
      method: "get",
    });
  },

  /** 获取菜单列表(树形) */
  getList(queryParams?: MenuQueryParams) {
    return request<MenuItem[]>({
      url: `${MENU_BASE_URL}`,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取菜单下拉选项(树形) */
  getOptions(params?: { types?: MenuType[] }) {
    return request<OptionItem[]>({
      url: `${MENU_BASE_URL}/options`,
      method: "get",
      params,
    });
  },

  /** 获取可作为上级菜单的下拉选项(按钮不能有子级，不返回) */
  getParentOptions() {
    return request<OptionItem[]>({
      url: `${MENU_BASE_URL}/options`,
      method: "get",
      params: { types: [MenuType.CATALOG, MenuType.MENU] },
    });
  },

  /** 获取菜单表单数据 */
  getFormData(id: string) {
    return request<MenuForm>({
      url: `${MENU_BASE_URL}/${id}/form`,
      method: "get",
    });
  },

  /** 新增菜单 */
  create(data: MenuForm) {
    return request({
      url: `${MENU_BASE_URL}`,
      method: "post",
      data,
    });
  },

  /** 修改菜单 */
  update(id: string, data: MenuForm) {
    return request({
      url: `${MENU_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /** 删除菜单 */
  deleteById(id: string) {
    return request({
      url: `${MENU_BASE_URL}/${id}`,
      method: "delete",
    });
  },
};

export default MenuAPI;

// 重导出类型
export * from "./types";

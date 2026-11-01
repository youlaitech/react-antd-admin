import request from "@/utils/request";
import type { OptionItem, PageResult } from "@/api/common";
import type {
  DictItem,
  DictItemForm,
  DictItemOption,
  DictItemQueryParams,
  DictTagType,
  DictTypeForm,
  DictTypeItem,
  DictTypeQueryParams,
} from "./types";

const DICT_BASE_URL = "/api/v1/dicts";

/**
 * 后端标签样式转前端取值
 */
function decodeDictTagType(code?: unknown): DictTagType {
  const value = String(code ?? "")
    .trim()
    .toUpperCase();

  switch (value) {
    case "P":
    case "PRIMARY":
      return "primary";
    case "S":
    case "SUCCESS":
      return "success";
    case "W":
    case "WARNING":
      return "warning";
    case "I":
    case "INFO":
      return "info";
    case "D":
    case "DANGER":
    case "ERROR":
      return "danger";
    default:
      return "";
  }
}

/**
 * 归一化列表项的标签样式
 */
function normalizeTagType<T extends { tagType?: unknown }>(
  item: T,
): Omit<T, "tagType"> & { tagType: DictTagType } {
  return { ...item, tagType: decodeDictTagType(item.tagType) };
}

const DictAPI = {
  /**
   * 获取字典分页列表
   */
  getPage(queryParams: DictTypeQueryParams) {
    return request<PageResult<DictTypeItem>>({
      url: `${DICT_BASE_URL}`,
      method: "get",
      params: queryParams,
    });
  },

  /**
   * 获取字典下拉选项
   */
  getOptions() {
    return request<OptionItem[]>({
      url: `${DICT_BASE_URL}/options`,
      method: "get",
    });
  },

  /**
   * 获取字典表单数据
   */
  getFormData(id: string) {
    return request<DictTypeForm>({
      url: `${DICT_BASE_URL}/${id}/form`,
      method: "get",
    });
  },

  /**
   * 新增字典
   */
  create(data: DictTypeForm) {
    return request({
      url: `${DICT_BASE_URL}`,
      method: "post",
      data,
    });
  },

  /**
   * 修改字典
   */
  update(id: string, data: DictTypeForm) {
    return request({
      url: `${DICT_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /**
   * 批量删除字典，多个以英文逗号(,)分割
   */
  deleteByIds(ids: string) {
    return request({
      url: `${DICT_BASE_URL}/${ids}`,
      method: "delete",
    });
  },

  /**
   * 获取字典项分页列表
   */
  getDictItemPage(dictCode: string, queryParams: DictItemQueryParams) {
    return request<PageResult<DictItem>>({
      url: `${DICT_BASE_URL}/${dictCode}/items`,
      method: "get",
      params: queryParams,
    }).then((data) => ({
      ...data,
      list: (data.list ?? []).map(normalizeTagType),
    }));
  },

  /**
   * 获取字典项下拉选项
   */
  getDictItems(dictCode: string) {
    return request<DictItemOption[]>({
      url: `${DICT_BASE_URL}/${dictCode}/items/options`,
      method: "get",
    }).then((items) => (items ?? []).map(normalizeTagType));
  },

  /**
   * 新增字典项
   */
  createDictItem(dictCode: string, data: DictItemForm) {
    return request({
      url: `${DICT_BASE_URL}/${dictCode}/items`,
      method: "post",
      data,
    });
  },

  /**
   * 获取字典项表单数据
   */
  getDictItemFormData(dictCode: string, id: string) {
    return request<DictItemForm>({
      url: `${DICT_BASE_URL}/${dictCode}/items/${id}/form`,
      method: "get",
    }).then(normalizeTagType);
  },

  /**
   * 修改字典项
   */
  updateDictItem(dictCode: string, id: string, data: DictItemForm) {
    return request({
      url: `${DICT_BASE_URL}/${dictCode}/items/${id}`,
      method: "put",
      data,
    });
  },

  /**
   * 批量删除字典项，多个以英文逗号(,)分割
   */
  deleteDictItems(dictCode: string, ids: string) {
    return request({
      url: `${DICT_BASE_URL}/${dictCode}/items/${ids}`,
      method: "delete",
    });
  },
};

export default DictAPI;

// 重导出类型
export * from "./types";

import request from "@/utils/request";
import type { PageResult } from "@/api/common";
import type {
  NoticeDetail,
  NoticeFormData,
  NoticeItem,
  NoticeQueryParams,
  NoticeSubmitForm,
} from "./types";

const NOTICE_BASE_URL = "/api/v1/notices";

const NoticeAPI = {
  /**
   * 获取通知公告分页列表
   */
  getPage(queryParams: NoticeQueryParams) {
    return request<PageResult<NoticeItem>>({
      url: `${NOTICE_BASE_URL}`,
      method: "get",
      params: queryParams,
    });
  },

  /**
   * 获取通知公告表单数据
   */
  getFormData(id: string) {
    return request<NoticeFormData>({
      url: `${NOTICE_BASE_URL}/${id}/form`,
      method: "get",
    });
  },

  /**
   * 新增通知公告
   */
  create(data: NoticeSubmitForm) {
    return request({
      url: `${NOTICE_BASE_URL}`,
      method: "post",
      data,
    });
  },

  /**
   * 修改通知公告
   */
  update(id: string, data: NoticeSubmitForm) {
    return request({
      url: `${NOTICE_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /**
   * 批量删除通知公告，多个以英文逗号(,)分割
   */
  deleteByIds(ids: string) {
    return request({
      url: `${NOTICE_BASE_URL}/${ids}`,
      method: "delete",
    });
  },

  /**
   * 发布通知公告
   */
  publish(id: string) {
    return request({
      url: `${NOTICE_BASE_URL}/${id}/publish`,
      method: "put",
    });
  },

  /**
   * 撤回通知公告
   */
  revoke(id: string) {
    return request({
      url: `${NOTICE_BASE_URL}/${id}/revoke`,
      method: "put",
    });
  },

  /**
   * 获取通知公告详情
   */
  getDetail(id: string) {
    return request<NoticeDetail>({
      url: `${NOTICE_BASE_URL}/${id}/detail`,
      method: "get",
    });
  },

  /**
   * 全部标记为已读
   */
  readAll() {
    return request({
      url: `${NOTICE_BASE_URL}/read-all`,
      method: "put",
    });
  },

  /**
   * 获取当前用户的通知公告分页列表
   */
  getMyNoticePage(queryParams: NoticeQueryParams) {
    return request<PageResult<NoticeItem>>({
      url: `${NOTICE_BASE_URL}/my`,
      method: "get",
      params: queryParams,
    });
  },
};

export default NoticeAPI;

// 重导出类型
export * from "./types";

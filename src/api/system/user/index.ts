import request from "@/utils/request";
import type { ExcelResult, OptionItem, PageResult } from "@/api/common";
import type {
  EmailUpdateForm,
  MobileUpdateForm,
  PasswordChangeForm,
  PasswordVerifyForm,
  UserForm,
  UserInfo,
  UserItem,
  UserProfileDetail,
  UserProfileForm,
  UserQueryParams,
} from "./types";

const USER_BASE_URL = "/api/v1/users";

const UserAPI = {
  /**
   * 获取当前登录用户信息
   * @returns 登录用户昵称、头像信息，包括角色和权限
   */
  getInfo() {
    return request<UserInfo>({
      url: `${USER_BASE_URL}/me`,
      method: "get",
    });
  },

  /** 获取用户分页列表 */
  getPage(queryParams: UserQueryParams) {
    return request<PageResult<UserItem>>({
      url: `${USER_BASE_URL}`,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取用户下拉选项 */
  getOptions() {
    return request<OptionItem[]>({
      url: `${USER_BASE_URL}/options`,
      method: "get",
    });
  },

  /** 获取用户表单数据 */
  getFormData(userId: string) {
    return request<UserForm>({
      url: `${USER_BASE_URL}/${userId}/form`,
      method: "get",
    });
  },

  /** 新增用户 */
  create(data: UserForm) {
    return request({
      url: `${USER_BASE_URL}`,
      method: "post",
      data,
    });
  },

  /** 修改用户 */
  update(id: string, data: UserForm) {
    return request({
      url: `${USER_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /** 重置用户密码 */
  resetPassword(id: string, password: string) {
    return request({
      url: `${USER_BASE_URL}/${id}/password/reset`,
      method: "put",
      data: { password },
    });
  },

  /** 批量删除用户，多个以英文逗号(,)分割 */
  deleteByIds(ids: string) {
    return request({
      url: `${USER_BASE_URL}/${ids}`,
      method: "delete",
    });
  },

  /** 下载用户导入模板 */
  downloadTemplate() {
    return request<{ data: BlobPart; headers: Record<string, unknown> }>({
      url: `${USER_BASE_URL}/template`,
      method: "get",
      responseType: "blob",
    });
  },

  /** 导出用户 */
  export(queryParams: UserQueryParams) {
    return request<{ data: BlobPart; headers: Record<string, unknown> }>({
      url: `${USER_BASE_URL}/export`,
      method: "get",
      params: queryParams,
      responseType: "blob",
    });
  },

  /** 导入用户 */
  import(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request<ExcelResult>({
      url: `${USER_BASE_URL}/import`,
      method: "post",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** 获取个人中心用户信息 */
  getProfile() {
    return request<UserProfileDetail>({
      url: `${USER_BASE_URL}/profile`,
      method: "get",
    });
  },

  /** 修改个人中心用户信息 */
  updateProfile(data: UserProfileForm) {
    return request({
      url: `${USER_BASE_URL}/profile`,
      method: "put",
      data,
    });
  },

  /** 修改个人中心用户密码 */
  changePassword(data: PasswordChangeForm) {
    return request({
      url: `${USER_BASE_URL}/password`,
      method: "put",
      data,
    });
  },

  /** 发送短信验证码(绑定或更换手机号) */
  sendMobileCode(mobile: string) {
    return request({
      url: `${USER_BASE_URL}/mobile/code`,
      method: "post",
      params: { mobile },
    });
  },

  /** 绑定或更换手机号 */
  bindOrChangeMobile(data: MobileUpdateForm) {
    return request({
      url: `${USER_BASE_URL}/mobile`,
      method: "put",
      data,
    });
  },

  /** 解绑手机号 */
  unbindMobile(data: PasswordVerifyForm) {
    return request({
      url: `${USER_BASE_URL}/mobile`,
      method: "delete",
      data,
    });
  },

  /** 发送邮箱验证码(绑定或更换邮箱) */
  sendEmailCode(email: string) {
    return request({
      url: `${USER_BASE_URL}/email/code`,
      method: "post",
      params: { email },
    });
  },

  /** 绑定或更换邮箱 */
  bindOrChangeEmail(data: EmailUpdateForm) {
    return request({
      url: `${USER_BASE_URL}/email`,
      method: "put",
      data,
    });
  },

  /** 解绑邮箱 */
  unbindEmail(data: PasswordVerifyForm) {
    return request({
      url: `${USER_BASE_URL}/email`,
      method: "delete",
      data,
    });
  },
};

export default UserAPI;

// 重导出类型
export * from "./types";

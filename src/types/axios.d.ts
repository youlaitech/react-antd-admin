import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /** 可选接口只对明确不支持的 HTTP 状态静默，由调用方决定是否回退。 */
    silentErrorStatuses?: readonly number[];
    /** 匿名请求：不注入访问令牌 */
    anonymous?: boolean;
    /** 请求发起时的登录会话，隔离旧请求的认证副作用。 */
    sessionRevision?: number;
    /** 获取用户和路由等权限初始化请求，遇到权限异常时不再触发权限刷新。 */
    skipPermissionRefresh?: boolean;
  }
}

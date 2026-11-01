import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import qs from "qs";

import { ApiCodeEnum } from "@/enums";
import { AuthStorage, getAuthSessionRevision } from "@/utils/auth";
import { feedback } from "@/utils/feedback";
import type { ApiResult } from "@/api/common";
import { useUserStore } from "@/stores/user";
import { usePermissionStore } from "@/stores/permission";

// 防止同一请求在 token 刷新后重复重试，导致死循环
const retriedRequests = new WeakSet<InternalAxiosRequestConfig>();

const http = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 50000,
  headers: { "Content-Type": "application/json;charset=utf-8" },
  // 数组参数序列化为 ids=1&ids=2，而非 ids[]=1&ids[]=2
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
});

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 记录发起时的会话，退出或换账号后旧响应不再续期、重试
    config.sessionRevision = getAuthSessionRevision();

    if (!config.anonymous) {
      const token = AuthStorage.getAccessToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

http.interceptors.response.use(
  (response: AxiosResponse<ApiResult>) => {
    const { responseType } = response.config;

    // 二进制数据直接透传
    if (responseType === "blob" || responseType === "arraybuffer") {
      return response;
    }

    const { code, data, msg } = response.data;

    if (code === ApiCodeEnum.SUCCESS) {
      // 剥离响应壳，业务层直接拿到 data
      return data as unknown as AxiosResponse;
    }

    feedback.error(msg || "系统出错");
    return Promise.reject(new Error(msg || "系统出错"));
  },

  async (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    const { config, response } = error;

    // 实时服务等可选接口未启用时不打扰用户，由调用方决定是否回退
    if (response && config?.silentErrorStatuses?.includes(response.status)) {
      return Promise.reject(error);
    }

    // 旧会话的失败响应不能触发当前账号续期或退出
    if (
      config?.sessionRevision !== undefined &&
      config.sessionRevision !== getAuthSessionRevision()
    ) {
      return Promise.reject(error);
    }

    if (!response) {
      feedback.error("网络连接失败");
      return Promise.reject(error);
    }

    const { code, msg } = response.data as ApiResult;

    // 访问令牌过期：先尝试静默刷新，刷新失败再走登录页
    if (code === ApiCodeEnum.ACCESS_TOKEN_INVALID) {
      const userStore = useUserStore.getState();

      if (!config || retriedRequests.has(config)) {
        await userStore.redirectToLogin();
        return Promise.reject(new Error("Token Invalid"));
      }

      retriedRequests.add(config);

      try {
        await userStore.refreshTokenOnce();

        // 续期期间切换过账号，旧请求不再重放到新会话
        if (config.sessionRevision !== getAuthSessionRevision()) {
          return Promise.reject(new Error("登录会话已切换"));
        }

        const token = AuthStorage.getAccessToken();
        if (token) {
          config.headers.set("Authorization", `Bearer ${token}`);
        }

        return http.request(config);
      } catch {
        if (config.sessionRevision !== getAuthSessionRevision()) {
          return Promise.reject(new Error("登录会话已切换"));
        }
        await userStore.redirectToLogin();
        return Promise.reject(new Error("Token refresh failed"));
      }
    }

    // 刷新令牌失效：旧会话的失败不能退出当前账号
    if (code === ApiCodeEnum.REFRESH_TOKEN_INVALID) {
      if (config?.sessionRevision === getAuthSessionRevision()) {
        await useUserStore.getState().redirectToLogin();
      }
      return Promise.reject(new Error("Token Invalid"));
    }

    // 权限不足：刷新一次权限后提示；权限初始化本身失败时直接提示，避免递归刷新
    if (code === ApiCodeEnum.PERMISSION_DENIED) {
      if (!config?.skipPermissionRefresh) {
        await usePermissionStore.getState().refreshPermissions();
      }
      feedback.error(msg || "权限不足");
      return Promise.reject(new Error(msg || "权限不足"));
    }

    feedback.error(msg || "请求失败");
    return Promise.reject(new Error(msg || "请求失败"));
  },
);

/**
 * 统一请求方法
 */
const request = <T = unknown>(config: AxiosRequestConfig): Promise<T> =>
  http.request(config) as unknown as Promise<T>;

/**
 * 未包装的 axios 实例，用于下载等需要完整响应的场景
 */
export { http };

export default request;

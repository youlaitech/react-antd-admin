import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import qs from "qs";

import { ApiCodeEnum } from "@/enums";
import { AuthStorage } from "@/utils/auth";
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
    const token = AuthStorage.getAccessToken();

    // 约定：调用方设置 Authorization 为 "no-auth" 即跳过 token 注入
    if (config.headers.Authorization === "no-auth") {
      delete config.headers.Authorization;
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
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
    const { config, response } = error;

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

        const token = AuthStorage.getAccessToken();
        if (token) {
          config.headers.set("Authorization", `Bearer ${token}`);
        }

        return http.request(config);
      } catch {
        await userStore.redirectToLogin();
        return Promise.reject(new Error("Token refresh failed"));
      }
    }

    // 刷新令牌失效
    if (code === ApiCodeEnum.REFRESH_TOKEN_INVALID) {
      await useUserStore.getState().redirectToLogin();
      return Promise.reject(new Error("Token Invalid"));
    }

    // 权限不足：刷新一次权限后提示
    if (code === ApiCodeEnum.PERMISSION_DENIED) {
      await usePermissionStore.getState().refreshPermissions();
      feedback.error(msg || "权限不足");
      return Promise.reject(new Error(msg || "权限不足"));
    }

    feedback.error(msg || "请求失败");
    return Promise.reject(new Error(msg || "请求失败"));
  }
);

/** 统一请求方法 */
const request = <T = unknown>(config: AxiosRequestConfig): Promise<T> =>
  http.request(config) as unknown as Promise<T>;

/** 未包装的 axios 实例，用于下载等需要完整响应的场景 */
export { http };

export default request;

import { create } from "zustand";

import AuthAPI from "@/api/auth";
import UserAPI from "@/api/system/user";
import type { LoginRequest } from "@/api/auth";
import type { UserInfo } from "@/api/system/user";

import { clearDictCache, teardownDictSync } from "@/hooks/useDict";
import { AuthStorage } from "@/utils/auth";
import { feedback } from "@/utils/feedback";
import { cleanupSse } from "@/utils/sse";
import { LOGIN_PATH } from "@/constants";
import { usePermissionStore } from "./permission";
import { useTagsViewStore } from "./tagsView";
import { useTenantStore } from "./tenant";

interface UserState {
  /** 登录用户信息 */
  userInfo: Partial<UserInfo>;
  /** 记住我状态 */
  rememberMe: boolean;
  /** 是否已登录 */
  isLoggedIn: () => boolean;
  /** 登录 */
  login: (loginRequest: LoginRequest) => Promise<void>;
  /** 扫码登录：用票据换取会话令牌 */
  loginByQrCode: (ticket: string) => Promise<void>;
  /** 获取用户信息 */
  getUserInfo: () => Promise<UserInfo>;
  /** 登出 */
  logout: () => Promise<void>;
  /** 重置全局状态 */
  resetAllState: () => void;
  /** 会话失效的统一出口：提示、清理状态、跳转登录页 */
  redirectToLogin: (message?: string, notify?: boolean) => Promise<void>;
  /** 刷新令牌 */
  refreshToken: () => Promise<void>;
  /** 刷新令牌（单飞模式，多个并发请求共享同一次刷新） */
  refreshTokenOnce: () => Promise<void>;
}

// 防止并发会话失效触发重复跳转登录页
let redirectingToLogin = false;
// 刷新中的 Promise，保证同一时刻只有一个刷新请求
let refreshPromise: Promise<void> | null = null;

export const useUserStore = create<UserState>((set, get) => ({
  userInfo: {} as UserInfo,
  rememberMe: AuthStorage.getRememberMe(),

  isLoggedIn: () => !!AuthStorage.getAccessToken(),

  login: async (loginRequest) => {
    const { accessToken, refreshToken } = await AuthAPI.login(loginRequest);
    const rememberMe = loginRequest.rememberMe ?? false;
    AuthStorage.setTokens(accessToken, refreshToken, rememberMe);
    set({ rememberMe });
  },

  loginByQrCode: async (ticket) => {
    const { accessToken, refreshToken } = await AuthAPI.qrLogin(ticket);
    AuthStorage.setTokens(accessToken, refreshToken, false);
  },

  getUserInfo: async () => {
    const data = await UserAPI.getInfo();
    if (!data) {
      throw new Error("获取用户信息失败，请重新登录");
    }
    set({ userInfo: data });
    return data;
  },

  logout: async () => {
    await AuthAPI.logout();
    get().resetAllState();
  },

  resetAllState: () => {
    // 1. 清理本地凭证
    AuthStorage.clearAuth();
    set({ userInfo: {} as UserInfo });

    // 2. 重置其他模块状态
    usePermissionStore.getState().resetRouter();
    useTagsViewStore.getState().delAllViews();
    useTenantStore.getState().clearTenant();

    // 3. 清理 SSE 连接与字典缓存，避免下个账号沿用上一个人的数据
    teardownDictSync();
    clearDictCache();
    cleanupSse();
  },

  redirectToLogin: async (message = "请重新登录", notify = true) => {
    if (redirectingToLogin) return;
    redirectingToLogin = true;

    try {
      if (notify) {
        feedback.notifyWarning("提示", message);
      }

      get().resetAllState();

      // hash 路由下直接改写地址栏，避开路由守卫的重复拦截
      const currentHash = window.location.hash.replace(/^#/, "");
      const redirect =
        currentHash && !currentHash.startsWith(LOGIN_PATH)
          ? `?redirect=${encodeURIComponent(currentHash)}`
          : "";

      window.location.href = `#${LOGIN_PATH}${redirect}`;
      window.location.reload();
    } finally {
      redirectingToLogin = false;
    }
  },

  refreshToken: async () => {
    const currentRefreshToken = AuthStorage.getRefreshToken();

    if (!currentRefreshToken) {
      throw new Error("没有有效的刷新令牌");
    }

    const { accessToken, refreshToken } = await AuthAPI.refreshToken(currentRefreshToken);
    AuthStorage.setTokens(accessToken, refreshToken, AuthStorage.getRememberMe());
  },

  refreshTokenOnce: () => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = get()
      .refreshToken()
      .finally(() => {
        refreshPromise = null;
      });

    return refreshPromise;
  },
}));

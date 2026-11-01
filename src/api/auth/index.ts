import request from "@/utils/request";
import type { CaptchaInfo, LoginRequest, LoginResult } from "./types";

const AUTH_BASE_URL = "/api/v1/auth";

const AuthAPI = {
  /**
   * 登录
   */
  login(data: LoginRequest) {
    return request<LoginResult>({
      url: `${AUTH_BASE_URL}/login`,
      method: "post",
      // 白名单接口携带过期令牌仍会被后端判 401
      anonymous: true,
      data: {
        username: data.username,
        password: data.password,
        captchaId: data.captchaId,
        captchaCode: data.captchaCode,
      },
    });
  },

  /**
   * 刷新令牌
   */
  refreshToken(refreshToken: string) {
    return request<LoginResult>({
      url: `${AUTH_BASE_URL}/refresh-token`,
      method: "post",
      anonymous: true,
      params: { refreshToken },
    });
  },

  /**
   * 登出
   */
  logout() {
    return request({
      url: `${AUTH_BASE_URL}/logout`,
      method: "delete",
    });
  },

  /**
   * 获取验证码
   */
  getCaptcha() {
    return request<CaptchaInfo>({
      url: `${AUTH_BASE_URL}/captcha`,
      method: "get",
      // 残留过期令牌会让白名单接口 401，登录页取不到验证码
      anonymous: true,
    });
  },
};

export default AuthAPI;

// 重导出类型
export * from "./types";

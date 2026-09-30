import request from "@/utils/request";
import type {
  CaptchaInfo,
  LoginRequest,
  LoginResult,
  QrCodeGenerateResult,
  QrCodeStatusResult,
} from "./types";

const AUTH_BASE_URL = "/api/v1/auth";

const AuthAPI = {
  /** 登录 */
  login(data: LoginRequest) {
    return request<LoginResult>({
      url: `${AUTH_BASE_URL}/login`,
      method: "post",
      data: {
        username: data.username,
        password: data.password,
        captchaId: data.captchaId,
        captchaCode: data.captchaCode,
      },
    });
  },

  /** 刷新令牌 */
  refreshToken(refreshToken: string) {
    return request<LoginResult>({
      url: `${AUTH_BASE_URL}/refresh-token`,
      method: "post",
      params: { refreshToken },
      headers: {
        Authorization: "no-auth",
      },
    });
  },

  /** 登出 */
  logout() {
    return request({
      url: `${AUTH_BASE_URL}/logout`,
      method: "delete",
    });
  },

  /** 获取验证码 */
  getCaptcha() {
    return request<CaptchaInfo>({
      url: `${AUTH_BASE_URL}/captcha`,
      method: "get",
    });
  },

  /** 申请扫码票据 */
  qrGenerate() {
    return request<QrCodeGenerateResult>({
      url: `${AUTH_BASE_URL}/qr-code/generate`,
      method: "post",
    });
  },

  /** 查询扫码状态 */
  qrStatus(ticket: string) {
    return request<QrCodeStatusResult>({
      url: `${AUTH_BASE_URL}/qr-code/status`,
      method: "get",
      params: { ticket },
    });
  },

  /** 票据换取会话令牌 */
  qrLogin(ticket: string) {
    return request<LoginResult>({
      url: `${AUTH_BASE_URL}/qr-code/login`,
      method: "post",
      data: { ticket },
    });
  },
};

export default AuthAPI;

// 重导出类型
export * from "./types";

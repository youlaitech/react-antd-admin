/**
 * 登录请求参数
 */
export interface LoginRequest {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 验证码缓存 key */
  captchaId?: string;
  /** 验证码 */
  captchaCode?: string;
  /** 记住我 */
  rememberMe?: boolean;
  /** 租户 ID */
  tenantId?: number;
}

/**
 * 登录结果
 */
export interface LoginResult {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 令牌类型 */
  tokenType: string;
  /** 过期时间(单位:秒) */
  expiresIn: number;
}

/**
 * 验证码信息
 */
export interface CaptchaInfo {
  /** 验证码缓存 key */
  captchaId: string;
  /** 验证码图片 Base64 */
  captchaBase64: string;
}

/**
 * 扫码票据
 */
export interface QrCodeGenerateResult {
  /** 一次扫码登录会话的唯一票据，由 PC 端编码进二维码 */
  ticket: string;
  /** 票据有效期（秒） */
  expireSeconds: number;
}

/**
 * 扫码状态
 */
export type QrCodeStatus =
  "WAITING" | "SCANNED" | "CONFIRMED" | "LOGGED_IN" | "CANCELED" | "EXPIRED";

/**
 * 轮询扫码状态的响应
 */
export interface QrCodeStatusResult {
  /** 当前票据 */
  ticket: string;
  /** 扫码状态 */
  status: QrCodeStatus;
  /** 脱敏昵称，仅 SCANNED 之后返回 */
  nickname?: string;
  /** 头像 URL，仅 SCANNED 之后返回 */
  avatar?: string;
  /** 票据剩余有效期（秒） */
  expireSeconds: number;
}

import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /** 为 true 时不注入访问令牌，用于登录、验证码等白名单接口 */
    anonymous?: boolean;
  }

  interface InternalAxiosRequestConfig {
    /** 为 true 时不注入访问令牌，用于登录、验证码等白名单接口 */
    anonymous?: boolean;
  }
}

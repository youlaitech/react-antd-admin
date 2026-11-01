import { STORAGE_KEYS } from "@/constants";
import { Storage } from "./storage";

let sessionRevision = 0;

/**
 * 登录会话版本，正常续期不递增，供异步回调判断是否仍属当前账号。
 */
export function getAuthSessionRevision(): number {
  return sessionRevision;
}

/**
 * 本地凭证读写
 */
export const AuthStorage = {
  getAccessToken(): string {
    const isRememberMe = Storage.get<boolean>(STORAGE_KEYS.REMEMBER_ME, false);
    return isRememberMe
      ? Storage.get(STORAGE_KEYS.ACCESS_TOKEN, "")
      : Storage.sessionGet(STORAGE_KEYS.ACCESS_TOKEN, "");
  },

  getRefreshToken(): string {
    const isRememberMe = Storage.get<boolean>(STORAGE_KEYS.REMEMBER_ME, false);
    return isRememberMe
      ? Storage.get(STORAGE_KEYS.REFRESH_TOKEN, "")
      : Storage.sessionGet(STORAGE_KEYS.REFRESH_TOKEN, "");
  },

  /**
   * 写入令牌
   * @param rememberMe 记住我时写 localStorage（关浏览器仍保留），否则写 sessionStorage
   * @param renewing 令牌续期，不递增会话版本
   */
  setTokens(
    accessToken: string,
    refreshToken: string,
    rememberMe: boolean,
    renewing = false,
  ): void {
    Storage.set(STORAGE_KEYS.REMEMBER_ME, rememberMe);
    if (rememberMe) {
      Storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      Storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      Storage.sessionRemove(STORAGE_KEYS.ACCESS_TOKEN);
      Storage.sessionRemove(STORAGE_KEYS.REFRESH_TOKEN);
    } else {
      Storage.sessionSet(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      Storage.sessionSet(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      Storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
      Storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    }
    if (!renewing) sessionRevision += 1;
  },

  /**
   * 清除令牌
   */
  clearAuth(): void {
    Storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    Storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    Storage.sessionRemove(STORAGE_KEYS.ACCESS_TOKEN);
    Storage.sessionRemove(STORAGE_KEYS.REFRESH_TOKEN);
    sessionRevision += 1;
  },

  getRememberMe(): boolean {
    return Storage.get<boolean>(STORAGE_KEYS.REMEMBER_ME, false);
  },
};

import { APP_PREFIX, STORAGE_KEYS } from "@/constants";

/**
 * 存储工具类
 */
export class Storage {
  /** 存储数据到 localStorage */
  static set(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /** 从 localStorage 获取数据 */
  static get<T>(key: string, defaultValue?: T): T {
    const value = localStorage.getItem(key);
    if (!value) return defaultValue as T;

    try {
      return JSON.parse(value);
    } catch {
      // 如果解析失败，返回原始字符串
      return value as unknown as T;
    }
  }

  /** 从 localStorage 删除数据 */
  static remove(key: string): void {
    localStorage.removeItem(key);
  }

  /** 存储数据到 sessionStorage */
  static sessionSet(key: string, value: unknown): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  /** 从 sessionStorage 获取数据 */
  static sessionGet<T>(key: string, defaultValue?: T): T {
    const value = sessionStorage.getItem(key);
    if (!value) return defaultValue as T;

    try {
      return JSON.parse(value);
    } catch {
      // 如果解析失败，返回原始字符串
      return value as unknown as T;
    }
  }

  /** 从 sessionStorage 删除数据 */
  static sessionRemove(key: string): void {
    sessionStorage.removeItem(key);
  }

  /**
   * 清理指定前缀的存储
   */
  static clearByPrefix(prefix: string): void {
    // localStorage 清理
    const localKeys = Object.keys(localStorage).filter((key) => key.startsWith(prefix));
    localKeys.forEach((key) => localStorage.removeItem(key));

    // sessionStorage 清理
    const sessionKeys = Object.keys(sessionStorage).filter((key) => key.startsWith(prefix));
    sessionKeys.forEach((key) => sessionStorage.removeItem(key));
  }

  /** 清理所有项目相关的存储 */
  static clearAllProject(): void {
    this.clearByPrefix(`${APP_PREFIX}:`);
  }

  /** 获取所有项目相关的存储键 */
  static getAllProjectKeys(): string[] {
    return Object.values(STORAGE_KEYS);
  }
}

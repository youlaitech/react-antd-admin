/// <reference types="vite/client" />

declare module "virtual:uno.css";

interface ImportMetaEnv {
  /**
   * 应用标题
   */
  readonly VITE_APP_TITLE: string;
  /**
   * 应用端口
   */
  readonly VITE_APP_PORT: number;
  /**
   * API 基础路径(反向代理)
   */
  readonly VITE_APP_BASE_API: string;
  /**
   * 接口地址
   */
  readonly VITE_APP_API_URL: string;
  /**
   * 本地 mock 开关，true 时由 mock/ 目录接管接口，未覆盖的接口仍走 VITE_APP_API_URL
   */
  readonly VITE_MOCK_ENABLED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * 构建时由 Vite define 注入的应用信息
 */
declare const __APP_INFO__: {
  pkg: {
    name: string;
    version: string;
  };
  buildTimestamp: number;
};

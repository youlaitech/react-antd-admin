import { createDefineMock } from "vite-plugin-mock-dev-server";

// 插件的 mock url 需为完整请求路径，这里统一拼 VITE_APP_BASE_API + /api/v1 前缀，各 mock 文件只写业务路径
const API_BASE = `${import.meta.env.VITE_APP_BASE_API ?? "/dev-api"}`.replace(/\/+$/, "");
const API_VERSION = "/api/v1";

export const defineMock = createDefineMock((mock) => {
  // 拼接完整请求路径：/dev-api/api/v1/users
  mock.url = `${API_BASE}${API_VERSION}/${`${mock.url}`.replace(/^\/+/, "")}`;
});

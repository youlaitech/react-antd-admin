/**
 * 判断路径是否为外部链接
 */
export function isExternal(path: string): boolean {
  return /^(https?:|mailto:|tel:|\/\/)/.test(path);
}

/**
 * 解析外链地址：http(s)/mailto/tel 原样返回，站内路径补全为当前站点地址
 *
 * 站内路径拼成 hash 地址（如 /data-screen → https://host/#/data-screen），供新标签页直接打开
 *
 * @param url 菜单配置的外链地址
 */
export function resolveExternalUrl(url: string): string {
  if (isExternal(url)) return url;

  return `${window.location.origin}${window.location.pathname}#${url}`;
}

/**
 * 打开外链：同源地址新标签页打开且不带 noopener，新页签可继承登录态；跨域地址带 noopener,noreferrer
 */
export function openExternalUrl(url: string): void {
  const sameOrigin = url.startsWith(`${window.location.origin}/`);

  window.open(url, "_blank", sameOrigin ? undefined : "noopener,noreferrer");
}

/**
 * 跳转菜单：外链菜单用新标签页打开，站内路径走路由
 *
 * @param key 菜单路径
 * @param navigate 路由跳转方法
 * @param query 菜单配置的路由参数，拼在路径后面
 */
export function navigateMenuKey(
  key: string,
  navigate: (path: string) => void,
  query?: Record<string, string>,
): void {
  if (isExternal(key)) {
    openExternalUrl(key);
    return;
  }

  const search = query ? new URLSearchParams(query).toString() : "";
  navigate(search ? `${key}?${search}` : key);
}

/**
 * 外链菜单的跳转地址：优先取 meta.externalUrl（后端对 E 型菜单透传），
 * 站内路径补全为当前站点地址；兼容绝对地址直接写在 path 上的历史数据
 *
 * @param route 后端菜单路由数据
 */
export function resolveMenuExternalUrl(route: {
  path?: string | null;
  component?: string | null;
  meta?: { externalUrl?: string } | null;
}): string {
  if (route.component && route.component !== "Layout") return "";

  const externalUrl = route.meta?.externalUrl;
  if (externalUrl) return resolveExternalUrl(externalUrl);

  const path = route.path ?? "";
  return isExternal(path) ? path : "";
}

/**
 * 拼接父子路由路径
 * @param basePath 父级访问路径
 * @param routePath 当前这一级的路径片段，以 / 开头时视为完整路径
 */
export function resolveRoutePath(basePath: string, routePath?: string): string {
  if (routePath && isExternal(routePath)) return routePath;
  if (isExternal(basePath)) return basePath;
  if (!routePath) return basePath;
  if (routePath.startsWith("/")) return routePath.replace(/\/+$/, "") || "/";

  return `${basePath}/${routePath}`.replace(/\/+/g, "/");
}

/**
 * 是否为合法的 URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 首字母大写
 */
export function toPascalCase(value: string): string {
  return value.replace(/(^|[-_])(\w)/g, (_, __, char: string) => char.toUpperCase());
}

/**
 * 睡眠指定毫秒数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 增长率格式化
 */
export function formatGrowthRate(rate?: number | null): string {
  if (rate == null || !Number.isFinite(rate)) {
    return "--";
  }

  const sign = rate > 0 ? "+" : "";
  return `${sign}${rate.toFixed(1)}%`;
}

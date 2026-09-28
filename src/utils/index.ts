/**
 * 判断路径是否为外部链接
 */
export function isExternal(path: string): boolean {
  return /^(https?:|mailto:|tel:|\/\/)/.test(path);
}

/**
 * 拼接父子路由路径
 */
export function resolveRoutePath(basePath: string, routePath: string): string {
  if (isExternal(routePath)) return routePath;
  if (isExternal(basePath)) return basePath;
  if (!routePath) return basePath;

  return `${basePath}/${routePath}`.replace(/\/+/g, "/");
}

/**
 * 拼接访问路径
 * @param basePath 父级访问路径
 * @param path 当前这一级的路径片段
 */
export function joinRoutePath(basePath: string, path?: string): string {
  if (!path) return basePath || "/";
  if (isExternal(path) || path.startsWith("/")) return path;
  return `${basePath.replace(/\/+$/, "")}/${path}`;
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

/** 增长率格式化 */
export function formatGrowthRate(rate?: number | null): string {
  if (rate == null || !Number.isFinite(rate)) {
    return "--";
  }

  const sign = rate > 0 ? "+" : "";
  return `${sign}${rate.toFixed(1)}%`;
}

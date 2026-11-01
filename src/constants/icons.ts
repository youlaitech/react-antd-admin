/**
 * 本地 SVG 图标名，由 Vite glob 读目录得出，不硬编码列表
 */
export const localIconNames: string[] = Object.keys(import.meta.glob("../assets/icons/*.svg")).map(
  (path) => path.replace("../assets/icons/", "").replace(".svg", ""),
);

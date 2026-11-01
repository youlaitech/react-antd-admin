import type { ReactNode } from "react";
import { MenuOutlined } from "@ant-design/icons";

import { antdIcons } from "@/constants/antd-icons";

// 本地图标清单，用于判断图标名是否真的存在
const LOCAL_ICONS = new Set(
  Object.keys(import.meta.glob("@/assets/icons/*.svg")).map(
    (path) => path.split("/").pop()?.replace(".svg", "") ?? "",
  ),
);

// 图标名无效时的兜底：用线条最少的菜单图标，避免一屏菜单全顶着同一个"应用方块"
const FALLBACK_ICON = <MenuOutlined />;

interface MenuIconProps {
  /** 菜单的 icon：本地 SVG 文件名，或 antd 图标组件名（如 UserOutlined） */
  icon?: string;
}

/**
 * 解析出图标的图形部分
 */
function resolveIcon(icon?: string): ReactNode {
  if (!icon) {
    return FALLBACK_ICON;
  }

  if (LOCAL_ICONS.has(icon)) {
    return <i className={`i-svg:${icon}`} />;
  }

  const AntdIcon = antdIcons[icon];
  return AntdIcon ? <AntdIcon /> : FALLBACK_ICON;
}

/**
 * 菜单图标，尺寸与文字间距由外层容器统一决定，避免两种图标对不齐
 */
export default function MenuIcon({ icon }: MenuIconProps) {
  return <span className="menu-icon-svg">{resolveIcon(icon)}</span>;
}

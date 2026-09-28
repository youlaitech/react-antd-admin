import type { ReactNode } from "react";
import {
  ApartmentOutlined,
  AppstoreOutlined,
  BellOutlined,
  BuildOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ClusterOutlined,
  CommentOutlined,
  CompassOutlined,
  CopyOutlined,
  DashboardOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  FormatPainterOutlined,
  KeyOutlined,
  LineChartOutlined,
  LinkOutlined,
  LockOutlined,
  MenuOutlined,
  MoneyCollectOutlined,
  MonitorOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  SettingOutlined,
  ShareAltOutlined,
  ShoppingCartOutlined,
  StarFilled,
  StarOutlined,
  TableOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";

import { antdIcons } from "@/constants/antd-icons";

/** 本地图标清单，用于判断后端给的图标名是否真的存在 */
const LOCAL_ICONS = new Set(
  Object.keys(import.meta.glob("@/assets/icons/*.svg")).map(
    (path) => path.split("/").pop()?.replace(".svg", "") ?? ""
  )
);

/** Element Plus 图标名到 Ant Design 图标的映射 */
const ELEMENT_ICON_MAP: Record<string, ReactNode> = {
  // 后端菜单在用
  User: <UserOutlined />,
  Monitor: <MonitorOutlined />,
  DataLine: <LineChartOutlined />,
  Cpu: <ClusterOutlined />,
  ShoppingCart: <ShoppingCartOutlined />,
  SetUp: <BuildOutlined />,
  Brush: <FormatPainterOutlined />,
  EditPen: <EditOutlined />,
  Guide: <CompassOutlined />,
  Share: <ShareAltOutlined />,
  Star: <StarOutlined />,
  StarFilled: <StarFilled />,
  Stopwatch: <FieldTimeOutlined />,
  Position: <EnvironmentOutlined />,
  Connection: <ApartmentOutlined />,
  Coin: <MoneyCollectOutlined />,
  Promotion: <SendOutlined />,
  Stamp: <SafetyCertificateOutlined />,
  Notification: <BellOutlined />,
  MagicStick: <ThunderboltOutlined />,
  Reading: <ReadOutlined />,
  Grid: <AppstoreOutlined />,
  List: <TableOutlined />,
  Document: <FileTextOutlined />,
  Tickets: <FileTextOutlined />,
  Files: <CopyOutlined />,
  Calendar: <CalendarOutlined />,
  ChatLineRound: <CommentOutlined />,
  Link: <LinkOutlined />,
  // 常见补充
  UserFilled: <UserOutlined />,
  Avatar: <UserOutlined />,
  ElementPlus: <AppstoreOutlined />,
  Menu: <MenuOutlined />,
  Setting: <SettingOutlined />,
  Tools: <ToolOutlined />,
  Folder: <FolderOutlined />,
  FolderOpened: <FolderOpenOutlined />,
  Lock: <LockOutlined />,
  Key: <KeyOutlined />,
  Clock: <ClockCircleOutlined />,
  Odometer: <DashboardOutlined />,
  Team: <TeamOutlined />,
};

// 图标名无效时的兜底：用线条最少的菜单图标，避免一屏菜单全顶着同一个"应用方块"
const FALLBACK_ICON = <MenuOutlined />;

interface MenuIconProps {
  /** 后端菜单的 icon，可为本地 SVG 文件名或 el-icon-Xxx */
  icon?: string;
}

/**
 * 解析出图标的图形部分
 */
function resolveIcon(icon?: string): ReactNode {
  if (!icon) {
    return FALLBACK_ICON;
  }

  if (icon.startsWith("el-icon-")) {
    const elementIconName = icon.replace("el-icon-", "");
    const AntdIcon = antdIcons[elementIconName];
    return ELEMENT_ICON_MAP[elementIconName] ?? (AntdIcon ? <AntdIcon /> : FALLBACK_ICON);
  }

  if (LOCAL_ICONS.has(icon)) {
    return <i className={`i-svg:${icon}`} />;
  }

  // 图标选择器里选的 antd 图标存的是组件名
  const AntdIcon = antdIcons[icon];
  return AntdIcon ? <AntdIcon /> : FALLBACK_ICON;
}

/** 菜单图标，尺寸与文字间距由外层容器统一决定，避免两种图标对不齐 */
export default function MenuIcon({ icon }: MenuIconProps) {
  return <span className="menu-icon-svg">{resolveIcon(icon)}</span>;
}

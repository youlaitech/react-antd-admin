/**
 * 应用配置
 */
import {
  LanguageEnum,
  LayoutMode,
  PageSwitchingAnimation,
  SidebarColor,
  TagsViewStyle,
  ThemeMode,
} from "@/enums";

const env = import.meta.env;
const { pkg } = __APP_INFO__;
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

export const appConfig = {
  name: pkg.name,
  version: pkg.version,
  title: env.VITE_APP_TITLE || pkg.name,
} as const;

/**
 * 语义色名称
 */
export const themeColorNames = ["primary", "success", "warning", "danger", "info"] as const;

export type ThemeColorName = (typeof themeColorNames)[number];

/**
 * 一套语义色
 */
export type ThemeColorMap = Record<ThemeColorName, string>;

/** 配色体系预设 */
export interface ThemePalettePreset {
  /** 预设标识 */
  id: string;
  /** 预设名称 */
  name: string;
  /** 预设包含的语义色 */
  colors: ThemeColorMap;
}

export const themePalettePresets: ThemePalettePreset[] = [
  {
    id: "antd",
    name: "AntD",
    colors: {
      primary: "#1677ff",
      success: "#52c41a",
      warning: "#faad14",
      danger: "#ff4d4f",
      info: "#1677ff",
    },
  },
  {
    id: "arco",
    name: "ArcoD",
    colors: {
      primary: "#165dff",
      success: "#00b42a",
      warning: "#ff7d00",
      danger: "#f53f3f",
      info: "#86909c",
    },
  },
  {
    id: "element",
    name: "ElementD",
    colors: {
      primary: "#409eff",
      success: "#67c23a",
      warning: "#e6a23c",
      danger: "#f56c6c",
      info: "#909399",
    },
  },
];

export const defaultThemePalette = themePalettePresets[0];

/** 手动改过颜色后使用的配色标识 */
export const CUSTOM_THEME_PALETTE = "custom";

/**
 * 各语义色的推荐色板，供设置面板的颜色选择器使用
 */
export const themeColorPresets: Record<ThemeColorName, string[]> = {
  primary: ["#1677ff", "#165dff", "#409eff", "#2f54eb", "#722ed1", "#13c2c2", "#eb2f96"],
  success: ["#52c41a", "#00b42a", "#67c23a", "#13c2c2"],
  warning: ["#faad14", "#ff7d00", "#e6a23c", "#fa8c16"],
  danger: ["#ff4d4f", "#f53f3f", "#f56c6c", "#eb2f96"],
  info: ["#1677ff", "#86909c", "#909399", "#8c8c8c"],
};

/** 语义色的中文名称，供设置面板逐项展示 */
export const themeColorLabels: Record<ThemeColorName, string> = {
  primary: "主题色",
  success: "成功色",
  warning: "警告色",
  danger: "错误色",
  info: "信息色",
};

/** 十六进制颜色值校验 */
export const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

export const defaults = {
  /** 跟随系统偏好决定初始主题 */
  theme: prefersDark ? ThemeMode.DARK : ThemeMode.LIGHT,
  themePalette: defaultThemePalette.id,
  themeColors: { ...defaultThemePalette.colors },
  layout: LayoutMode.LEFT,
  language: LanguageEnum.ZH_CN,
  sidebarColor: SidebarColor.MINIMAL_WHITE,
  showTagsView: true,
  tagsViewStyle: TagsViewStyle.CARD,
  showAppLogo: true,
  pageSwitchingAnimation: PageSwitchingAnimation.FADE_SLIDE,
  showWatermark: false,
  grayMode: false,
  colorWeak: false,
} as const;

export * from "./api";
export * from "./business";

/**
 * 主题模式
 */
export enum ThemeMode {
  /** 明亮 */
  LIGHT = "light",
  /** 暗黑 */
  DARK = "dark",
  /** 跟随系统 */
  AUTO = "auto",
}

/**
 * 语言类型
 */
export enum LanguageEnum {
  ZH_CN = "zh-CN",
  EN_US = "en-US",
}

/**
 * 侧边栏配色
 */
export enum SidebarColor {
  /** 浅色 */
  MINIMAL_WHITE = "minimal-white",
  /** 深蓝 */
  CLASSIC_BLUE = "classic-blue",
}

/**
 * 布局模式
 */
export enum LayoutMode {
  /** 左侧菜单 */
  LEFT = "left",
  /** 顶部菜单 */
  TOP = "top",
  /** 顶部一级菜单 + 侧边子菜单 */
  MIX = "mix",
  /** 双列侧边栏：左侧一级图标栏 + 右侧子菜单 */
  DOUBLE = "double",
}

/**
 * 多页签风格
 */
export enum TagsViewStyle {
  /** 线性：选中项用下划线指示 */
  LINE = "line",
  /** 卡片：选中项带底色与描边 */
  CARD = "card",
}

/**
 * 页面切换动画
 */
export enum PageSwitchingAnimation {
  /** 无动画 */
  NONE = "none",
  /** 淡入淡出 */
  FADE = "fade",
  /** 平滑切换 */
  FADE_SLIDE = "fade-slide",
  /** 缩放切换 */
  FADE_SCALE = "fade-scale",
}

/**
 * 组件尺寸，取值与 antd ConfigProvider 的 componentSize 一致
 */
export const ComponentSize = {
  /** 大 */
  LARGE: "large",
  /** 默认 */
  MIDDLE: "middle",
  /** 小 */
  SMALL: "small",
} as const;

export type ComponentSize = (typeof ComponentSize)[keyof typeof ComponentSize];

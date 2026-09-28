import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  LanguageEnum,
  LayoutMode,
  PageSwitchingAnimation,
  SidebarColor,
  TagsViewStyle,
  ThemeMode,
} from "@/enums";
import { STORAGE_KEYS } from "@/constants";
import {
  CUSTOM_THEME_PALETTE,
  HEX_COLOR_RE,
  themePalettePresets,
  defaults,
  type ThemeColorMap,
  type ThemeColorName,
} from "@/settings";

interface AppState {
  /** 主题模式 */
  theme: ThemeMode;
  /** 当前配色体系标识，手动改色后为 custom */
  themePalette: string;
  /** 语义色集合 */
  themeColors: ThemeColorMap;
  /** 布局模式 */
  layout: LayoutMode;
  /** 界面语言 */
  language: LanguageEnum;
  /** 侧边栏配色 */
  sidebarColor: SidebarColor;
  /** 侧边栏折叠状态 */
  collapsed: boolean;
  /** 是否显示多页签 */
  showTagsView: boolean;
  /** 多页签风格 */
  tagsViewStyle: TagsViewStyle;
  /** 是否显示 Logo */
  showAppLogo: boolean;
  /** 页面切换动画 */
  pageSwitchingAnimation: PageSwitchingAnimation;
  /** 是否显示水印 */
  showWatermark: boolean;
  /** 灰色模式 */
  grayMode: boolean;
  /** 色弱模式 */
  colorWeak: boolean;
  /** 设置面板是否展开 */
  settingsVisible: boolean;

  /** 切换主题模式 */
  setTheme: (theme: ThemeMode) => void;
  /** 套用配色体系预设，会一并替换全部语义色 */
  setThemePalette: (paletteId: string) => void;
  /** 修改单个语义色，配色体系随之标记为 custom */
  setThemeColor: (name: ThemeColorName, color: string) => void;
  /** 切换布局模式 */
  setLayout: (layout: LayoutMode) => void;
  /** 切换语言 */
  setLanguage: (language: LanguageEnum) => void;
  /** 切换侧边栏配色 */
  setSidebarColor: (sidebarColor: SidebarColor) => void;
  /** 切换侧边栏折叠状态 */
  toggleCollapsed: () => void;
  /** 切换多页签显示 */
  setShowTagsView: (showTagsView: boolean) => void;
  /** 切换多页签风格 */
  setTagsViewStyle: (tagsViewStyle: TagsViewStyle) => void;
  /** 切换 Logo 显示 */
  setShowAppLogo: (showAppLogo: boolean) => void;
  /** 切换页面切换动画 */
  setPageSwitchingAnimation: (animation: PageSwitchingAnimation) => void;
  /** 切换水印显示 */
  setShowWatermark: (showWatermark: boolean) => void;
  /** 切换灰色模式 */
  setGrayMode: (grayMode: boolean) => void;
  /** 切换色弱模式 */
  setColorWeak: (colorWeak: boolean) => void;
  /** 切换设置面板 */
  setSettingsVisible: (visible: boolean) => void;
  /** 恢复默认设置 */
  resetSettings: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: defaults.theme,
      themePalette: defaults.themePalette,
      themeColors: { ...defaults.themeColors },
      layout: defaults.layout,
      language: defaults.language,
      sidebarColor: defaults.sidebarColor,
      collapsed: false,
      showTagsView: defaults.showTagsView,
      tagsViewStyle: defaults.tagsViewStyle,
      showAppLogo: defaults.showAppLogo,
      pageSwitchingAnimation: defaults.pageSwitchingAnimation,
      showWatermark: defaults.showWatermark,
      grayMode: defaults.grayMode,
      colorWeak: defaults.colorWeak,
      settingsVisible: false,

      setTheme: (theme) => set({ theme }),

      setThemePalette: (paletteId) => {
        const preset = themePalettePresets.find((item) => item.id === paletteId);
        if (!preset) return;
        set({ themePalette: preset.id, themeColors: { ...preset.colors } });
      },

      setThemeColor: (name, color) => {
        // 颜色来源有颜色选择器，值可能是半成品，落库前先校验
        if (!HEX_COLOR_RE.test(color)) return;
        set({
          themePalette: CUSTOM_THEME_PALETTE,
          themeColors: { ...get().themeColors, [name]: color },
        });
      },

      setLayout: (layout) => set({ layout }),
      setLanguage: (language) => set({ language }),
      setSidebarColor: (sidebarColor) => set({ sidebarColor }),
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      setShowTagsView: (showTagsView) => set({ showTagsView }),
      setTagsViewStyle: (tagsViewStyle) => set({ tagsViewStyle }),
      setShowAppLogo: (showAppLogo) => set({ showAppLogo }),
      setPageSwitchingAnimation: (pageSwitchingAnimation) => set({ pageSwitchingAnimation }),
      setShowWatermark: (showWatermark) => set({ showWatermark }),
      setGrayMode: (grayMode) => set({ grayMode }),
      setColorWeak: (colorWeak) => set({ colorWeak }),
      setSettingsVisible: (settingsVisible) => set({ settingsVisible }),

      resetSettings: () =>
        set({
          theme: defaults.theme,
          themePalette: defaults.themePalette,
          themeColors: { ...defaults.themeColors },
          layout: defaults.layout,
          language: defaults.language,
          sidebarColor: defaults.sidebarColor,
          showTagsView: defaults.showTagsView,
          tagsViewStyle: defaults.tagsViewStyle,
          showAppLogo: defaults.showAppLogo,
          pageSwitchingAnimation: defaults.pageSwitchingAnimation,
          showWatermark: defaults.showWatermark,
          grayMode: defaults.grayMode,
          colorWeak: defaults.colorWeak,
        }),
    }),
    {
      name: STORAGE_KEYS.APP_SETTINGS,
      // 折叠状态、设置面板属于会话内状态，不落盘
      partialize: (state) => ({
        theme: state.theme,
        themePalette: state.themePalette,
        themeColors: state.themeColors,
        layout: state.layout,
        language: state.language,
        sidebarColor: state.sidebarColor,
        showTagsView: state.showTagsView,
        tagsViewStyle: state.tagsViewStyle,
        showAppLogo: state.showAppLogo,
        pageSwitchingAnimation: state.pageSwitchingAnimation,
        showWatermark: state.showWatermark,
        grayMode: state.grayMode,
        colorWeak: state.colorWeak,
      }),
    }
  )
);

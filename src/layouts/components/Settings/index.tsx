import { useState } from "react";
import {
  App as AntdApp,
  Button,
  ColorPicker,
  Divider,
  Drawer,
  Segmented,
  Select,
  Switch,
  Tooltip,
} from "antd";
import { CheckOutlined, CopyOutlined, UndoOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import {
  LanguageEnum,
  LayoutMode,
  PageSwitchingAnimation,
  SidebarColor,
  TagsViewStyle,
  ThemeMode,
} from "@/enums";
import { useThemeDark } from "@/hooks/useThemeDark";
import {
  themeColorNames,
  themeColorPresets,
  themePalettePresets,
  type ThemeColorName,
} from "@/settings";
import { useAppStore } from "@/stores/app";

/** 布局模式选项 */
const LAYOUT_OPTIONS = [
  { value: LayoutMode.LEFT, labelKey: "settings.layoutLeft" },
  { value: LayoutMode.TOP, labelKey: "settings.layoutTop" },
  { value: LayoutMode.MIX, labelKey: "settings.layoutMix" },
  { value: LayoutMode.DOUBLE, labelKey: "settings.layoutDouble" },
];

/** 页签风格选项 */
const TAGS_VIEW_STYLE_OPTIONS = [
  { value: TagsViewStyle.CARD, labelKey: "settings.tagsViewCard" },
  { value: TagsViewStyle.LINE, labelKey: "settings.tagsViewLine" },
];

/** 页面切换动画选项 */
const ANIMATION_OPTIONS = [
  { value: PageSwitchingAnimation.NONE, labelKey: "settings.animationNone" },
  { value: PageSwitchingAnimation.FADE, labelKey: "settings.animationFade" },
  { value: PageSwitchingAnimation.FADE_SLIDE, labelKey: "settings.animationFadeSlide" },
  { value: PageSwitchingAnimation.FADE_SCALE, labelKey: "settings.animationFadeScale" },
];

/** 语义色的文案 key，显式写全而不是按字段名拼接 */
const THEME_COLOR_LABEL_KEYS: Record<ThemeColorName, string> = {
  primary: "settings.colorNames.primary",
  success: "settings.colorNames.success",
  warning: "settings.colorNames.warning",
  danger: "settings.colorNames.danger",
  info: "settings.colorNames.info",
};

/**
 * 分组标题，两侧带分隔线
 */
function SectionTitle({ children }: { children: string }) {
  return <div className="settings-panel__section-title">{children}</div>;
}

/**
 * 设置抽屉
 */
export default function Settings() {
  const { t } = useTranslation();
  const { message, modal } = AntdApp.useApp();

  const theme = useAppStore((state) => state.theme);
  const themePalette = useAppStore((state) => state.themePalette);
  const themeColors = useAppStore((state) => state.themeColors);
  const layout = useAppStore((state) => state.layout);
  const language = useAppStore((state) => state.language);
  const sidebarColor = useAppStore((state) => state.sidebarColor);
  const showTagsView = useAppStore((state) => state.showTagsView);
  const tagsViewStyle = useAppStore((state) => state.tagsViewStyle);
  const showAppLogo = useAppStore((state) => state.showAppLogo);
  const pageSwitchingAnimation = useAppStore((state) => state.pageSwitchingAnimation);
  const showWatermark = useAppStore((state) => state.showWatermark);
  const grayMode = useAppStore((state) => state.grayMode);
  const colorWeak = useAppStore((state) => state.colorWeak);
  const settingsVisible = useAppStore((state) => state.settingsVisible);

  const setTheme = useAppStore((state) => state.setTheme);
  const setThemePalette = useAppStore((state) => state.setThemePalette);
  const setThemeColor = useAppStore((state) => state.setThemeColor);
  const setLayout = useAppStore((state) => state.setLayout);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const setSidebarColor = useAppStore((state) => state.setSidebarColor);
  const setShowTagsView = useAppStore((state) => state.setShowTagsView);
  const setTagsViewStyle = useAppStore((state) => state.setTagsViewStyle);
  const setShowAppLogo = useAppStore((state) => state.setShowAppLogo);
  const setPageSwitchingAnimation = useAppStore((state) => state.setPageSwitchingAnimation);
  const setShowWatermark = useAppStore((state) => state.setShowWatermark);
  const setGrayMode = useAppStore((state) => state.setGrayMode);
  const setColorWeak = useAppStore((state) => state.setColorWeak);
  const setSettingsVisible = useAppStore((state) => state.setSettingsVisible);
  const resetSettings = useAppStore((state) => state.resetSettings);

  const [colorsExpanded, setColorsExpanded] = useState(false);

  // 暗色主题下侧边栏本身是深色，"经典蓝"没有意义，这一项只在浅色主题下出现
  const isDark = useThemeDark();

  /**
   * 复制当前配置
   */
  async function handleCopySettings() {
    const snippet = JSON.stringify(
      {
        theme,
        themePalette,
        themeColors,
        layout,
        sidebarColor,
        showTagsView,
        tagsViewStyle,
        showAppLogo,
        pageSwitchingAnimation,
        showWatermark,
      },
      null,
      2
    );

    try {
      await navigator.clipboard.writeText(snippet);
      message.success(t("settings.copySuccess"));
    } catch {
      message.error(t("settings.copyFail"));
    }
  }

  function handleResetSettings() {
    modal.confirm({
      title: t("common.tips"),
      content: t("settings.resetConfirm"),
      onOk: () => {
        resetSettings();
        message.success(t("settings.resetSuccess"));
      },
    });
  }

  return (
    <Drawer
      title={t("settings.title")}
      size={380}
      open={settingsVisible}
      onClose={() => setSettingsVisible(false)}
      footer={
        <div className="settings-panel__footer">
          <Button type="primary" icon={<CopyOutlined />} onClick={handleCopySettings}>
            {t("settings.copySettings")}
          </Button>
          <Button icon={<UndoOutlined />} onClick={handleResetSettings}>
            {t("settings.resetSettings")}
          </Button>
        </div>
      }
    >
      <div className="settings-panel">
        <SectionTitle>{t("settings.theme")}</SectionTitle>

        <div className="settings-panel__item">
          <span>{t("settings.themeMode")}</span>
          <Segmented
            size="small"
            value={theme}
            options={[
              { label: t("settings.themeLight"), value: ThemeMode.LIGHT },
              { label: t("settings.themeDark"), value: ThemeMode.DARK },
              { label: t("settings.themeAuto"), value: ThemeMode.AUTO },
            ]}
            onChange={(value) => setTheme(value as ThemeMode)}
          />
        </div>

        <div className="settings-panel__block">
          <div className="settings-panel__label">{t("settings.palette")}</div>
          <div className="settings-palette-strip">
            {themePalettePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`settings-palette-strip__item${
                  themePalette === preset.id ? " is-active" : ""
                }`}
                onClick={() => setThemePalette(preset.id)}
              >
                <span className="settings-palette-strip__dots">
                  {themeColorNames.map((name) => (
                    <i key={name} style={{ backgroundColor: preset.colors[name] }} />
                  ))}
                </span>
                <span className="settings-palette-strip__name">{preset.name}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="settings-panel__expand"
            onClick={() => setColorsExpanded((prev) => !prev)}
          >
            <span>{t("settings.customColor")}</span>
            <span className={`settings-panel__arrow${colorsExpanded ? " is-open" : ""}`}>›</span>
          </button>

          {colorsExpanded && (
            <div className="settings-color-list">
              {themeColorNames.map((name: ThemeColorName) => (
                <div key={name} className="settings-color-list__row">
                  <span>{t(THEME_COLOR_LABEL_KEYS[name])}</span>
                  <ColorPicker
                    value={themeColors[name]}
                    presets={[{ label: "", colors: themeColorPresets[name] }]}
                    onChangeComplete={(color) => setThemeColor(name, color.toHexString())}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Divider className="settings-panel__divider" />

        <SectionTitle>{t("settings.navigation")}</SectionTitle>

        <div className="settings-panel__block">
          <div className="settings-panel__label">{t("settings.layout")}</div>
          <div className="settings-layout-grid">
            {LAYOUT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`settings-layout-grid__item${
                  layout === option.value ? " is-active" : ""
                }`}
                onClick={() => setLayout(option.value)}
              >
                <span
                  className={`settings-layout-preview settings-layout-preview--${option.value}`}
                >
                  <i className="settings-layout-preview__header" />
                  <i className="settings-layout-preview__sidebar" />
                  <i className="settings-layout-preview__main" />
                </span>
                <span className="settings-layout-grid__name">{t(option.labelKey)}</span>
                {layout === option.value && (
                  <CheckOutlined className="settings-layout-grid__check" />
                )}
              </button>
            ))}
          </div>
        </div>

        {!isDark && (
          <div className="settings-panel__item">
            <span>{t("settings.sidebarColor")}</span>
            <Segmented
              size="small"
              value={sidebarColor}
              options={[
                { label: t("settings.sidebarMinimalWhite"), value: SidebarColor.MINIMAL_WHITE },
                { label: t("settings.sidebarClassicBlue"), value: SidebarColor.CLASSIC_BLUE },
              ]}
              onChange={(value) => setSidebarColor(value as SidebarColor)}
            />
          </div>
        )}

        <Divider className="settings-panel__divider" />

        <SectionTitle>{t("settings.interface")}</SectionTitle>

        <div className="settings-panel__item">
          <span>{t("settings.language")}</span>
          <Segmented
            size="small"
            value={language}
            options={[
              { label: "中文", value: LanguageEnum.ZH_CN },
              { label: "English", value: LanguageEnum.EN_US },
            ]}
            onChange={(value) => setLanguage(value as LanguageEnum)}
          />
        </div>

        <div className="settings-panel__item">
          <span>{t("settings.showTagsView")}</span>
          <Switch checked={showTagsView} onChange={setShowTagsView} />
        </div>

        {showTagsView && (
          <div className="settings-panel__block">
            <div className="settings-panel__label">{t("settings.tagsViewStyle")}</div>
            <div className="settings-tabs-style">
              {TAGS_VIEW_STYLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`settings-tabs-style__item${
                    tagsViewStyle === option.value ? " is-active" : ""
                  }`}
                  onClick={() => setTagsViewStyle(option.value)}
                >
                  <span
                    className={`settings-tabs-style__preview settings-tabs-style__preview--${option.value}`}
                  >
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="settings-tabs-style__name">{t(option.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="settings-panel__item">
          <span>{t("settings.showAppLogo")}</span>
          <Switch checked={showAppLogo} onChange={setShowAppLogo} />
        </div>

        <div className="settings-panel__item">
          <span>{t("settings.pageSwitchingAnimation")}</span>
          <Select
            size="small"
            className="w-140px"
            value={pageSwitchingAnimation}
            options={ANIMATION_OPTIONS.map((item) => ({
              value: item.value,
              label: t(item.labelKey),
            }))}
            onChange={setPageSwitchingAnimation}
          />
        </div>

        <Divider className="settings-panel__divider" />

        <SectionTitle>{t("settings.assist")}</SectionTitle>

        <div className="settings-panel__item">
          <span>{t("settings.showWatermark")}</span>
          <Switch checked={showWatermark} onChange={setShowWatermark} />
        </div>

        <div className="settings-panel__item">
          <Tooltip title={t("settings.grayModeTip")}>
            <span>{t("settings.grayMode")}</span>
          </Tooltip>
          <Switch checked={grayMode} onChange={setGrayMode} />
        </div>

        <div className="settings-panel__item">
          <Tooltip title={t("settings.colorWeakTip")}>
            <span>{t("settings.colorWeak")}</span>
          </Tooltip>
          <Switch checked={colorWeak} onChange={setColorWeak} />
        </div>
      </div>
    </Drawer>
  );
}

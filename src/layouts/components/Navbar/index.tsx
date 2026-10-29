import { useNavigate } from "react-router-dom";
import { App as AntdApp, Avatar, Button, Dropdown, Space, Tooltip, type MenuProps } from "antd";
import {
  DownOutlined,
  FontSizeOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  GlobalOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SettingOutlined,
  SunOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import logo from "@/assets/images/logo.png";
import CommandPalette from "@/components/CommandPalette";
import NoticeCenter from "@/components/NoticeCenter";
import { ComponentSize, LanguageEnum, LayoutMode, ThemeMode } from "@/enums";
import { useFullscreen } from "@/hooks/useFullscreen";
import { appConfig } from "@/settings";
import { useAppStore } from "@/stores/app";
import { useUserStore } from "@/stores/user";
import Breadcrumb from "../Breadcrumb";
import HeaderMenu from "../HeaderMenu";

/** 语言选项 */
const LANGUAGE_OPTIONS = [
  { key: LanguageEnum.ZH_CN, label: "简体中文" },
  { key: LanguageEnum.EN_US, label: "English" },
];

/** 组件尺寸选项 */
const SIZE_OPTION_KEYS = [
  { key: ComponentSize.LARGE, labelKey: "navbar.sizeLarge" },
  { key: ComponentSize.MIDDLE, labelKey: "navbar.sizeMiddle" },
  { key: ComponentSize.SMALL, labelKey: "navbar.sizeSmall" },
];

/**
 * 顶栏
 * 右侧工具区以文字按钮为主，尺寸与悬浮态由主题约束
 */
export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { modal, message } = AntdApp.useApp();

  const collapsed = useAppStore((state) => state.collapsed);
  const layout = useAppStore((state) => state.layout);
  const size = useAppStore((state) => state.size);
  const showAppLogo = useAppStore((state) => state.showAppLogo);
  const theme = useAppStore((state) => state.theme);
  const language = useAppStore((state) => state.language);
  const toggleCollapsed = useAppStore((state) => state.toggleCollapsed);
  const setTheme = useAppStore((state) => state.setTheme);
  const setSize = useAppStore((state) => state.setSize);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const setSettingsVisible = useAppStore((state) => state.setSettingsVisible);

  const userInfo = useUserStore((state) => state.userInfo);
  const logout = useUserStore((state) => state.logout);

  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const isDark = theme === ThemeMode.DARK;
  const isLeftLayout = layout === LayoutMode.LEFT;
  // 顶部与混合布局把菜单放在顶栏，双列布局的菜单在侧边栏
  const showHeaderMenu = layout === LayoutMode.TOP || layout === LayoutMode.MIX;
  // 侧边栏仍在的布局才需要折叠按钮
  const showCollapseButton = layout === LayoutMode.MIX || layout === LayoutMode.DOUBLE;

  const collapseIcon = collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />;

  function handleLogout() {
    modal.confirm({
      title: t("common.tips"),
      content: t("login.logoutConfirm"),
      onOk: async () => {
        await logout();
        message.success(t("login.logout"));
        navigate("/login", { replace: true });
      },
    });
  }

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: t("navbar.profile"),
      onClick: () => navigate("/profile"),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: t("login.logout"),
      onClick: handleLogout,
    },
  ];

  return (
    <div className="app-navbar flex-x-between flex-shrink-0 gap-4 px-4">
      <div className="flex-y-center flex-1 min-w-0 gap-3">
        {isLeftLayout ? (
          <>
            <Button type="text" icon={collapseIcon} onClick={toggleCollapsed} />
            <Breadcrumb />
          </>
        ) : (
          <>
            {showAppLogo && (
              <div className="app-logo app-logo--header">
                <img className="app-logo__image" src={logo} alt={appConfig.title} />
                <span className="app-logo__title">{appConfig.title}</span>
              </div>
            )}
            {/* 折叠按钮紧跟 logo：它作用于侧边栏，放在右上角和主题、全屏混在一起不合逻辑 */}
            {showCollapseButton && (
              <Tooltip title={collapsed ? t("navbar.expandSidebar") : t("navbar.collapseSidebar")}>
                <Button type="text" icon={collapseIcon} onClick={toggleCollapsed} />
              </Tooltip>
            )}
            {showHeaderMenu && <HeaderMenu variant={layout === LayoutMode.TOP ? "top" : "mix"} />}
            {layout === LayoutMode.DOUBLE && <Breadcrumb />}
          </>
        )}
      </div>

      <Space size={4}>
        <CommandPalette />

        <Dropdown
          trigger={["click"]}
          menu={{
            items: SIZE_OPTION_KEYS.map((item) => ({ key: item.key, label: t(item.labelKey) })),
            selectable: true,
            selectedKeys: [size],
            onClick: ({ key }) => setSize(key as ComponentSize),
          }}
        >
          <Tooltip title={t("navbar.size")}>
            <Button type="text" icon={<FontSizeOutlined />} />
          </Tooltip>
        </Dropdown>

        <Dropdown
          trigger={["click"]}
          menu={{
            items: LANGUAGE_OPTIONS,
            selectable: true,
            selectedKeys: [language],
            onClick: ({ key }) => setLanguage(key as LanguageEnum),
          }}
        >
          <Tooltip title={t("navbar.language")}>
            <Button type="text" icon={<GlobalOutlined />} />
          </Tooltip>
        </Dropdown>

        <Tooltip title={isDark ? t("settings.switchToLight") : t("settings.switchToDark")}>
          <Button
            type="text"
            icon={isDark ? <MoonOutlined /> : <SunOutlined />}
            onClick={() => setTheme(isDark ? ThemeMode.LIGHT : ThemeMode.DARK)}
          />
        </Tooltip>

        <Tooltip title={isFullscreen ? t("navbar.exitFullscreen") : t("navbar.fullscreen")}>
          <Button
            type="text"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          />
        </Tooltip>

        <NoticeCenter />

        {/* 账户放在系统入口之前：从「面向当前用户」到「面向整个系统」，越靠右越全局 */}
        <Dropdown trigger={["click"]} menu={{ items: userMenuItems }}>
          <div className="app-navbar__user">
            <Avatar size={26} src={userInfo.avatar} icon={<UserOutlined />} />
            <span className="app-navbar__nickname">{userInfo.nickname ?? userInfo.username}</span>
            <DownOutlined className="app-navbar__caret" />
          </div>
        </Dropdown>

        <Tooltip title={t("settings.title")}>
          <Button type="text" icon={<SettingOutlined />} onClick={() => setSettingsVisible(true)} />
        </Tooltip>
      </Space>
    </div>
  );
}

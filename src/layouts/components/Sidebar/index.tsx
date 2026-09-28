import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, type MenuProps } from "antd";
import { useTranslation } from "react-i18next";

import logo from "@/assets/images/logo.png";
import MenuIcon from "@/components/MenuIcon";
import { HOME_PATH } from "@/constants";
import { LayoutMode } from "@/enums";
import { buildMenuItems } from "@/router/menu";
import { appConfig } from "@/settings";
import { useAppStore } from "@/stores/app";
import { usePermissionStore } from "@/stores/permission";
import { resolveRoutePath } from "@/utils";

type MenuItem = Required<MenuProps>["items"][number];

/**
 * 由访问路径推导需要展开的父级菜单
 */
function deriveOpenKeys(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((_, index) => `/${segments.slice(0, index + 1).join("/")}`);
}

/** 侧边栏菜单 */
export default function Sidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const layout = useAppStore((state) => state.layout);
  const collapsed = useAppStore((state) => state.collapsed);
  const showAppLogo = useAppStore((state) => state.showAppLogo);
  const menuRoutes = usePermissionStore((state) => state.menuRoutes);
  const activeTopMenuPath = usePermissionStore((state) => state.activeTopMenuPath);

  const isLeftLayout = layout === LayoutMode.LEFT;

  const sideRoutes = useMemo(() => {
    if (isLeftLayout) return menuRoutes;

    const topRoute = menuRoutes.find(
      (route) => resolveRoutePath("", route.path ?? "") === activeTopMenuPath
    );
    return topRoute?.children ?? [];
  }, [isLeftLayout, menuRoutes, activeTopMenuPath]);

  const items = useMemo(() => {
    const menuItems = buildMenuItems(
      isLeftLayout ? menuRoutes : sideRoutes,
      isLeftLayout ? "" : activeTopMenuPath
    );

    if (!isLeftLayout) return menuItems;

    // 首页是静态路由，不在后端菜单里，左侧布局单独补一个入口
    const homeItem: MenuItem = {
      key: HOME_PATH,
      icon: <MenuIcon icon="homepage" />,
      label: t("menu.dashboard"),
    };

    return [homeItem, ...menuItems];
  }, [isLeftLayout, menuRoutes, sideRoutes, activeTopMenuPath, t]);

  const [openKeys, setOpenKeys] = useState<string[]>(() => deriveOpenKeys(pathname));

  // 路由或布局变化后同步展开对应的父级菜单
  useEffect(() => {
    setOpenKeys(deriveOpenKeys(pathname));
  }, [pathname, layout]);

  return (
    <div className="h-full flex flex-col">
      {isLeftLayout && showAppLogo && (
        <div className="app-logo">
          <img className="app-logo__image" src={logo} alt={appConfig.title} />
          {!collapsed && <span className="app-logo__title truncate">{appConfig.title}</span>}
        </div>
      )}

      <Menu
        className="flex-1 overflow-x-hidden overflow-y-auto border-e-0"
        mode="inline"
        items={items}
        selectedKeys={[pathname]}
        openKeys={collapsed ? undefined : openKeys}
        onOpenChange={setOpenKeys}
        onClick={({ key }) => navigate(key)}
      />
    </div>
  );
}

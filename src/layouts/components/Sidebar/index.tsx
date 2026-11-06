import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu } from "antd";
import { useTranslation } from "react-i18next";

import logo from "@/assets/images/logo.png";
import { LayoutMode } from "@/enums";
import { useActiveTopMenuPath } from "@/hooks/useActiveTopMenuPath";
import {
  buildMenuItems,
  deriveMenuOpenKeys,
  findMenuQuery,
  findTopChildren,
  homeMenuItem,
} from "@/router/menu";
import { appConfig } from "@/settings";
import { useAppStore } from "@/stores/app";
import { usePermissionStore } from "@/stores/permission";
import { navigateMenuKey } from "@/utils";

/**
 * 侧边栏菜单
 */
export default function Sidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const layout = useAppStore((state) => state.layout);
  const collapsed = useAppStore((state) => state.collapsed);
  const showAppLogo = useAppStore((state) => state.showAppLogo);
  const menuRoutes = usePermissionStore((state) => state.menuRoutes);

  const isLeftLayout = layout === LayoutMode.LEFT;
  const effectiveTopPath = useActiveTopMenuPath(!isLeftLayout);

  const sideRoutes = useMemo(
    () => (isLeftLayout ? menuRoutes : findTopChildren(menuRoutes, effectiveTopPath)),
    [isLeftLayout, menuRoutes, effectiveTopPath],
  );

  const items = useMemo(() => {
    const menuItems = buildMenuItems(
      isLeftLayout ? menuRoutes : sideRoutes,
      isLeftLayout ? "" : effectiveTopPath,
    );

    // 首页是静态路由，不在后端菜单里，左侧布局单独补一个入口
    return isLeftLayout ? [homeMenuItem(t), ...menuItems] : menuItems;
  }, [isLeftLayout, menuRoutes, sideRoutes, effectiveTopPath, t]);

  const [openKeys, setOpenKeys] = useState<string[]>(() => deriveMenuOpenKeys(pathname));

  // 路由或布局变化后同步展开对应的父级菜单
  useEffect(() => {
    setOpenKeys(deriveMenuOpenKeys(pathname));
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
        inlineCollapsed={collapsed}
        items={items}
        selectedKeys={[pathname]}
        openKeys={collapsed ? undefined : openKeys}
        onOpenChange={setOpenKeys}
        onClick={({ key }) => navigateMenuKey(key, navigate, findMenuQuery(menuRoutes, key))}
      />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import type { RouteItem } from "@/api/system/menu";
import { HOME_PATH } from "@/constants";
import { useActiveTopMenuPath } from "@/hooks/useActiveTopMenuPath";
import {
  buildMenuItems,
  deriveMenuOpenKeys,
  findFirstLeafPath,
  findMenuQuery,
  findTopChildren,
  renderMenuIcon,
} from "@/router/menu";
import { useAppStore } from "@/stores/app";
import { usePermissionStore } from "@/stores/permission";
import {
  navigateMenuKey,
  openExternalUrl,
  resolveMenuExternalUrl,
  resolveRoutePath,
} from "@/utils";

/**
 * 双列侧边栏
 */
export default function DoubleSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const collapsed = useAppStore((state) => state.collapsed);
  const menuRoutes = usePermissionStore((state) => state.menuRoutes);
  const setActiveTopMenuPath = usePermissionStore((state) => state.setActiveTopMenuPath);

  const topRoutes = useMemo(
    () => menuRoutes.filter((route) => !route.meta?.hidden && route.path),
    [menuRoutes],
  );

  const effectiveTopPath = useActiveTopMenuPath();
  // 首页不属于任何一级菜单，此时一级栏只高亮首页
  const isHome = pathname === HOME_PATH;

  const sideRoutes = useMemo(
    () => findTopChildren(menuRoutes, effectiveTopPath),
    [menuRoutes, effectiveTopPath],
  );

  const items = useMemo(
    () => buildMenuItems(sideRoutes, effectiveTopPath),
    [sideRoutes, effectiveTopPath],
  );

  const [openKeys, setOpenKeys] = useState<string[]>(() => deriveMenuOpenKeys(pathname));

  // 路由变化后展开到当前页面所在的父级菜单
  useEffect(() => {
    setOpenKeys(deriveMenuOpenKeys(pathname));
  }, [pathname]);

  function handlePrimaryClick(route: RouteItem, path: string) {
    // 外链一级菜单：新标签页打开，不参与路由跳转
    const externalUrl = resolveMenuExternalUrl(route);
    if (externalUrl) {
      openExternalUrl(externalUrl);
      return;
    }

    setActiveTopMenuPath(path);

    // 切换一级菜单后跳到它的第一个叶子页面，避免地址与子菜单不一致
    const firstLeafPath = findFirstLeafPath(menuRoutes, path);
    if (firstLeafPath) {
      navigateMenuKey(firstLeafPath, navigate, findMenuQuery(menuRoutes, firstLeafPath));
    }
  }

  return (
    <div className="double-sidebar">
      <div className="double-sidebar__primary">
        {/* 首页是静态路由，不在菜单树里，单独放在一级栏首位 */}
        <Tooltip title={t("menu.dashboard")} placement="right">
          <button
            type="button"
            className={`double-sidebar__primary-item ${isHome ? "is-active" : ""}`}
            onClick={() => navigate(HOME_PATH)}
          >
            {renderMenuIcon("homepage")}
            <span className="double-sidebar__primary-label">{t("menu.dashboard")}</span>
          </button>
        </Tooltip>
        {topRoutes.map((route) => {
          const path = resolveRoutePath("", route.path ?? "");
          const title = route.meta?.title ?? route.name;

          return (
            <Tooltip key={path} title={title} placement="right">
              <button
                type="button"
                className={`double-sidebar__primary-item ${!isHome && path === effectiveTopPath ? "is-active" : ""}`}
                onClick={() => handlePrimaryClick(route, path)}
              >
                {renderMenuIcon(route.meta?.icon)}
                <span className="double-sidebar__primary-label">{title}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>

      {!collapsed && (
        <div className="double-sidebar__secondary">
          <Menu
            className="flex-1 overflow-x-hidden overflow-y-auto border-e-0"
            mode="inline"
            items={items}
            selectedKeys={[pathname]}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            onClick={({ key }) => navigateMenuKey(key, navigate, findMenuQuery(menuRoutes, key))}
          />
        </div>
      )}
    </div>
  );
}

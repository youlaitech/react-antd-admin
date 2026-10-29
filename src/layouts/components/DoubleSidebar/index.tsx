import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Tooltip } from "antd";

import type { RouteItem } from "@/api/system/menu";
import {
  buildMenuItems,
  findFirstLeafPath,
  findMenuQuery,
  matchTopMenuPath,
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
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const collapsed = useAppStore((state) => state.collapsed);
  const menuRoutes = usePermissionStore((state) => state.menuRoutes);
  const activeTopMenuPath = usePermissionStore((state) => state.activeTopMenuPath);
  const setActiveTopMenuPath = usePermissionStore((state) => state.setActiveTopMenuPath);

  const topRoutes = useMemo(
    () => menuRoutes.filter((route) => !route.meta?.hidden && route.path),
    [menuRoutes]
  );

  // 由当前地址反推激活的一级菜单，保证刷新后两列同步
  useEffect(() => {
    const matched = matchTopMenuPath(menuRoutes, pathname);
    if (matched && matched !== activeTopMenuPath) {
      setActiveTopMenuPath(matched);
    }
  }, [menuRoutes, pathname, activeTopMenuPath, setActiveTopMenuPath]);

  const sideRoutes = useMemo(() => {
    const topRoute = topRoutes.find(
      (route) => resolveRoutePath("", route.path ?? "") === activeTopMenuPath
    );
    return topRoute?.children ?? [];
  }, [topRoutes, activeTopMenuPath]);

  const items = useMemo(
    () => buildMenuItems(sideRoutes, activeTopMenuPath),
    [sideRoutes, activeTopMenuPath]
  );

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
        {topRoutes.map((route) => {
          const path = resolveRoutePath("", route.path ?? "");
          const title = route.meta?.title ?? route.name;

          return (
            <Tooltip key={path} title={title} placement="right">
              <button
                type="button"
                className={`double-sidebar__primary-item ${path === activeTopMenuPath ? "is-active" : ""}`}
                onClick={() => handlePrimaryClick(route, path)}
              >
                {renderMenuIcon(route.meta?.icon)}
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
            onClick={({ key }) => navigateMenuKey(key, navigate, findMenuQuery(menuRoutes, key))}
          />
        </div>
      )}
    </div>
  );
}

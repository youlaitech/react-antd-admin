import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu } from "antd";

import {
  buildMenuItems,
  buildTopMenuItems,
  findFirstLeafPath,
  findMenuQuery,
  matchTopMenuPath,
} from "@/router/menu";
import { usePermissionStore } from "@/stores/permission";
import { isExternal, navigateMenuKey, openExternalUrl } from "@/utils";

interface HeaderMenuProps {
  /** top 展示完整层级，mix 只展示一级菜单用于切换侧边栏 */
  variant: "top" | "mix";
}

/**
 * 顶栏菜单
 */
export default function HeaderMenu({ variant }: HeaderMenuProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const menuRoutes = usePermissionStore((state) => state.menuRoutes);
  const activeTopMenuPath = usePermissionStore((state) => state.activeTopMenuPath);
  const setActiveTopMenuPath = usePermissionStore((state) => state.setActiveTopMenuPath);

  const items = useMemo(
    () => (variant === "mix" ? buildTopMenuItems(menuRoutes) : buildMenuItems(menuRoutes)),
    [variant, menuRoutes],
  );

  // 混合布局由当前地址推导顶栏激活项，刷新后仍能保持高亮
  useEffect(() => {
    if (variant !== "mix") return;

    const matched = matchTopMenuPath(menuRoutes, pathname);
    if (matched && matched !== activeTopMenuPath) {
      setActiveTopMenuPath(matched);
    }
  }, [variant, menuRoutes, pathname, activeTopMenuPath, setActiveTopMenuPath]);

  function handleMenuClick(key: string) {
    // 外链菜单：新标签页打开，不参与路由跳转
    if (isExternal(key)) {
      openExternalUrl(key);
      return;
    }

    if (variant === "mix") {
      setActiveTopMenuPath(key);

      // 切换一级菜单后跳到它的第一个叶子页面，避免地址与侧边栏不一致
      const firstLeafPath = findFirstLeafPath(menuRoutes, key);
      if (firstLeafPath) {
        navigateMenuKey(firstLeafPath, navigate, findMenuQuery(menuRoutes, firstLeafPath));
      }
      return;
    }

    navigateMenuKey(key, navigate, findMenuQuery(menuRoutes, key));
  }

  return (
    <Menu
      className="header-menu"
      mode="horizontal"
      items={items}
      selectedKeys={[variant === "mix" ? activeTopMenuPath : pathname]}
      onClick={({ key }) => handleMenuClick(key)}
    />
  );
}

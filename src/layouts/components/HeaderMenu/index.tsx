import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu } from "antd";
import { useTranslation } from "react-i18next";

import { HOME_PATH } from "@/constants";
import { useActiveTopMenuPath } from "@/hooks/useActiveTopMenuPath";
import {
  buildMenuItems,
  buildTopMenuItems,
  findFirstLeafPath,
  findMenuQuery,
  homeMenuItem,
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const menuRoutes = usePermissionStore((state) => state.menuRoutes);
  const setActiveTopMenuPath = usePermissionStore((state) => state.setActiveTopMenuPath);

  const items = useMemo(() => {
    const menuItems =
      variant === "mix" ? buildTopMenuItems(menuRoutes) : buildMenuItems(menuRoutes);
    return [homeMenuItem(t), ...menuItems];
  }, [variant, menuRoutes, t]);

  // 混合布局按一级菜单高亮，顶部布局按完整地址高亮
  const activeTopPath = useActiveTopMenuPath(variant === "mix");
  const activeKey = useMemo(() => {
    if (variant !== "mix") return pathname;
    // 首页不属于任何一级菜单，选中态落在首页本身
    return pathname === HOME_PATH ? HOME_PATH : activeTopPath;
  }, [variant, pathname, activeTopPath]);

  function handleMenuClick(key: string) {
    if (key === HOME_PATH) {
      navigate(HOME_PATH);
      return;
    }

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
      selectedKeys={[activeKey]}
      onClick={({ key }) => handleMenuClick(key)}
    />
  );
}

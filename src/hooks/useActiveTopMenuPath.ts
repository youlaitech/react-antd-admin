import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { resolveActiveTopMenuPath } from "@/router/menu";
import { usePermissionStore } from "@/stores/permission";

/**
 * 当前生效的一级菜单路径
 *
 * 静态页面沿用已激活分组，分组无效时回退第一个一级菜单
 *
 * @param enabled 为 false 时不回写 store，供顶部菜单布局关闭同步
 */
export function useActiveTopMenuPath(enabled = true): string {
  const { pathname } = useLocation();

  const menuRoutes = usePermissionStore((state) => state.menuRoutes);
  const activeTopMenuPath = usePermissionStore((state) => state.activeTopMenuPath);
  const setActiveTopMenuPath = usePermissionStore((state) => state.setActiveTopMenuPath);

  const target = resolveActiveTopMenuPath(menuRoutes, pathname, activeTopMenuPath);

  useEffect(() => {
    if (!enabled || target === activeTopMenuPath) return;
    setActiveTopMenuPath(target);
  }, [enabled, target, activeTopMenuPath, setActiveTopMenuPath]);

  return target;
}

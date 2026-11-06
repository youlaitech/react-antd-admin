import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { AFFIX_PATHS } from "@/constants";
import { resolveRouteInfo } from "@/router/menu";
import { usePermissionStore } from "@/stores/permission";
import { useTagsViewStore } from "@/stores/tagsView";

/**
 * 按当前地址登记页签，菜单或语言变化时刷新标题
 */
export function useRegisterVisitedView() {
  const { pathname, search } = useLocation();
  const { t } = useTranslation();
  const menuRoutes = usePermissionStore((state) => state.menuRoutes);
  const addView = useTagsViewStore((state) => state.addView);

  useEffect(() => {
    const { title, icon, keepAlive } = resolveRouteInfo(pathname, menuRoutes, t);
    if (!title) return;

    addView({
      path: pathname + search,
      title,
      icon,
      affix: AFFIX_PATHS.has(pathname),
      keepAlive,
    });
  }, [pathname, search, menuRoutes, t, addView]);
}

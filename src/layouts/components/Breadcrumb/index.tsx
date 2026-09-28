import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { findRouteChain, resolveRouteInfo } from "@/router/menu";
import { usePermissionStore } from "@/stores/permission";

/** 面包屑 */
export default function Breadcrumb() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const menuRoutes = usePermissionStore((state) => state.menuRoutes);

  const titles = useMemo(() => {
    const chain = findRouteChain(menuRoutes, pathname);
    if (chain.length > 0) {
      return chain.flatMap((meta) => (meta.title ? [meta.title] : []));
    }

    const { title } = resolveRouteInfo(pathname, [], t);
    return title ? [title] : [];
  }, [menuRoutes, pathname, t]);

  if (titles.length === 0) {
    return null;
  }

  return (
    <nav className="app-breadcrumb" aria-label="breadcrumb">
      {titles.map((title, index) => (
        <span key={`${title}-${index}`} className="app-breadcrumb__item">
          {title}
          {index < titles.length - 1 && <span className="app-breadcrumb__separator">/</span>}
        </span>
      ))}
    </nav>
  );
}

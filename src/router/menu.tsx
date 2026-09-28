import type { MenuProps } from "antd";
import type { TFunction } from "i18next";

import type { Meta, RouteItem } from "@/api/system/menu";
import MenuIcon from "@/components/MenuIcon";
import { isExternal, resolveRoutePath } from "@/utils";

type MenuItem = Required<MenuProps>["items"][number];

/** 渲染菜单图标 */
function renderIcon(icon?: string) {
  if (!icon) return undefined;
  return <MenuIcon icon={icon} />;
}

/**
 * 对外暴露图标渲染，供双列布局的一级图标栏使用
 */
export function renderMenuIcon(icon?: string) {
  return renderIcon(icon);
}

/**
 * 过滤掉隐藏菜单与外链菜单
 */
function visibleRoutes(routes: RouteItem[]) {
  return routes.filter((route) => !route.meta?.hidden && !isExternal(route.path ?? ""));
}

/**
 * 后端菜单数据转为 Ant Design 菜单项
 * @param routes 菜单路由数据
 * @param parentPath 父级路径，用于拼出子菜单的完整路径
 */
export function buildMenuItems(routes: RouteItem[], parentPath = ""): MenuItem[] {
  return visibleRoutes(routes).map((route) => {
    const fullPath = resolveRoutePath(parentPath, route.path ?? "");
    const children = visibleRoutes(route.children ?? []);

    // 壳层目录（自身无标题）只有唯一子菜单时下沉到该子菜单，避免多出一层无标题分组
    if (!route.meta?.title && children.length === 1) {
      const onlyChild = children[0];
      return {
        key: resolveRoutePath(fullPath, onlyChild.path ?? ""),
        icon: renderIcon(onlyChild.meta?.icon ?? route.meta?.icon),
        label: onlyChild.meta?.title ?? onlyChild.name,
      };
    }

    if (children.length > 0) {
      return {
        key: fullPath,
        icon: renderIcon(route.meta?.icon),
        label: route.meta?.title ?? route.name,
        children: buildMenuItems(children, fullPath),
      };
    }

    return {
      key: fullPath,
      icon: renderIcon(route.meta?.icon),
      label: route.meta?.title ?? route.name,
    };
  });
}

/**
 * 按访问路径查找路由 meta，用于页签标题与面包屑
 */
export function findRouteMeta(
  routes: RouteItem[],
  pathname: string,
  parentPath = ""
): Meta | undefined {
  for (const route of routes) {
    const fullPath = resolveRoutePath(parentPath, route.path ?? "");
    if (fullPath === pathname) {
      return route.meta;
    }

    if (route.children?.length) {
      const matched = findRouteMeta(route.children, pathname, fullPath);
      if (matched) return matched;
    }
  }

  return undefined;
}

/**
 * 查找匹配路径的路由链，由顶层菜单到当前页面，用于面包屑
 */
export function findRouteChain(routes: RouteItem[], pathname: string, parentPath = ""): Meta[] {
  for (const route of routes) {
    const fullPath = resolveRoutePath(parentPath, route.path ?? "");

    if (fullPath === pathname) {
      return route.meta ? [route.meta] : [];
    }

    if (route.children?.length) {
      const childChain = findRouteChain(route.children, pathname, fullPath);
      if (childChain.length > 0) {
        return route.meta ? [route.meta, ...childChain] : childChain;
      }
    }
  }

  return [];
}

/** 静态路由的标题与图标 */
const STATIC_ROUTE_META: Record<string, { titleKey: string; icon?: string }> = {
  "/dashboard": { titleKey: "menu.dashboard", icon: "homepage" },
  "/profile": { titleKey: "menu.profile", icon: "user" },
  "/profile/notice": { titleKey: "menu.myNotice", icon: "user" },
  // 详情页是动态路由，访问路径形如 /detail/1，按第一段匹配
  "/detail": { titleKey: "demo.detail.title" },
  // 公开表单分享页，路径形如 /f/employee_onboarding
  "/f": { titleKey: "menu.formShare" },
  "/401": { titleKey: "menu.forbidden" },
  "/404": { titleKey: "menu.notFound" },
};

/** 查找静态路由的配置 */
function findStaticMeta(pathname: string) {
  if (STATIC_ROUTE_META[pathname]) return STATIC_ROUTE_META[pathname];

  const firstSegment = `/${pathname.split("/").filter(Boolean)[0] ?? ""}`;
  return STATIC_ROUTE_META[firstSegment];
}

/**
 * 解析路由的标题与图标，后端菜单优先，静态路由回退到本地配置
 * @param pathname 访问路径
 * @param routes 后端菜单路由数据
 * @param t 语言包取值函数，静态路由需要它翻译 key
 */
export function resolveRouteInfo(
  pathname: string,
  routes: RouteItem[],
  t?: TFunction
): { title: string; icon?: string; keepAlive: boolean } {
  const meta = findRouteMeta(routes, pathname);
  if (meta?.title) {
    return {
      title: meta.title,
      icon: meta.icon,
      // 页面缓存开关随页签一起登记，供内容区决定是否保留页面状态
      keepAlive: Boolean(meta.keepAlive),
    };
  }

  const staticMeta = findStaticMeta(pathname);
  return {
    title: staticMeta && t ? t(staticMeta.titleKey) : "",
    icon: staticMeta?.icon,
    keepAlive: false,
  };
}

/** 按组件路径反查路由访问路径 */
export function findRoutePathByComponent(
  routes: RouteItem[],
  component: string,
  parentPath = ""
): string {
  for (const route of routes) {
    const fullPath = resolveRoutePath(parentPath, route.path ?? "");

    if (route.component === component) {
      return fullPath;
    }

    if (route.children?.length) {
      const matched = findRoutePathByComponent(route.children, component, fullPath);
      if (matched) return matched;
    }
  }

  return "";
}

/**
 * 只构建一级菜单项，用于混合布局顶栏
 */
export function buildTopMenuItems(routes: RouteItem[]): MenuItem[] {
  return visibleRoutes(routes).map((route) => ({
    key: resolveRoutePath("", route.path ?? ""),
    icon: renderIcon(route.meta?.icon),
    label: route.meta?.title ?? route.name,
  }));
}

/** 匹配访问路径所属的一级菜单 */
export function matchTopMenuPath(routes: RouteItem[], pathname: string): string {
  for (const route of visibleRoutes(routes)) {
    const fullPath = resolveRoutePath("", route.path ?? "");
    if (pathname === fullPath || pathname.startsWith(`${fullPath}/`)) {
      return fullPath;
    }
  }

  return "";
}

/**
 * 查找指定一级菜单下第一个可跳转的叶子路径
 */
export function findFirstLeafPath(routes: RouteItem[], topPath: string): string {
  const topRoute = visibleRoutes(routes).find(
    (route) => resolveRoutePath("", route.path ?? "") === topPath
  );

  return topRoute ? resolveLeafPath(topRoute, topPath) : "";
}

function resolveLeafPath(route: RouteItem, fullPath: string): string {
  if (route.redirect) {
    return route.redirect;
  }

  const children = visibleRoutes(route.children ?? []);
  if (children.length === 0) {
    return fullPath;
  }

  const firstChild = children[0];
  return resolveLeafPath(firstChild, resolveRoutePath(fullPath, firstChild.path ?? ""));
}

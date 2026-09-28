import { lazy, type ComponentType, type ElementType } from "react";
import { Navigate, Outlet, type RouteObject } from "react-router-dom";

import type { RouteItem } from "@/api/system/menu";
import BasicLayout from "@/layouts";
import { isExternal } from "@/utils";

// 页面组件映射表，key 形如 ../views/system/user/index.tsx
const modules = import.meta.glob("../views/**/*.tsx");

// 后端配置了组件但前端还没实现时的兜底页面
const UnderConstruction = lazy(() => import("@/views/error/under-construction"));

/**
 * 按需加载页面组件
 * /index 要再去掉找一次，否则这类菜单会掉进建设中占位页
 */
function resolveComponent(componentPath: string): ElementType {
  const normalized = componentPath
    .trim()
    .replace(/^\/+/, "")
    .replace(/\.tsx$/i, "");

  const names = normalized.endsWith("/index")
    ? [normalized, normalized.slice(0, -"/index".length)]
    : [normalized];

  const loader = names
    .map((name) => modules[`../views/${name}.tsx`] ?? modules[`../views/${name}/index.tsx`])
    .find(Boolean);

  if (!loader) {
    console.warn(`组件 ${componentPath} 尚未实现，已回退到建设中占位页`);
    return UnderConstruction;
  }

  return lazy(loader as () => Promise<{ default: ComponentType }>);
}

/**
 * 后端路由数据转为 React Router 路由配置
 * @param routes 后端返回的路由数据
 * @param isTopLevel 是否为顶层路由，顶层才会挂载 Layout 布局
 */
export function transformRoutes(routes: RouteItem[], isTopLevel = true): RouteObject[] {
  return routes
    .filter((route) => !!route.path && !isExternal(route.path))
    .map((route) => transformRoute(route, isTopLevel));
}

function transformRoute(route: RouteItem, isTopLevel: boolean): RouteObject {
  const { path, component, children, redirect } = route;
  const result: RouteObject = { path };

  if (component === "Layout") {
    // 非顶层的目录壳不再重复挂载布局
    if (isTopLevel) {
      result.element = <BasicLayout />;
    }
  } else if (component) {
    const Page = resolveComponent(component);
    result.element = <Page />;
  }

  const transformedChildren = children?.length ? transformRoutes(children, false) : [];

  if (transformedChildren.length > 0) {
    result.children = redirect
      ? [{ index: true, element: <Navigate to={redirect} replace /> }, ...transformedChildren]
      : transformedChildren;

    // 目录节点自身没有组件时，需要 Outlet 才能渲染出子路由
    if (!result.element) {
      result.element = <Outlet />;
    }
  } else if (redirect) {
    result.element = <Navigate to={redirect} replace />;
  }

  return result;
}

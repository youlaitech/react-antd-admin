import type { RouteItem } from "@/api/system/menu";

import { MENU_TABLE } from "./menu-table.data";

/**
 * 生成路由用到的菜单字段
 */
interface MenuNode {
  children?: MenuNode[];
  component?: string | null;
  externalUrl?: string | null;
  icon?: string | null;
  keepAlive?: number;
  name?: string;
  redirect?: string | null;
  routeName?: string | null;
  routePath?: string | null;
  sort?: number;
  type?: string;
  visible?: number;
}

/**
 * 菜单树转动态路由，按钮不参与路由
 */
function toRoutes(nodes: MenuNode[]): RouteItem[] {
  return nodes
    .filter((node) => node.type !== "B")
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((node) => {
      const externalUrl = node.externalUrl || undefined;
      const route: RouteItem = {
        // 外链菜单没有路由路径，用外链地址占位
        path: node.routePath || externalUrl,
        component: node.component || undefined,
        name: node.routeName || undefined,
        meta: {
          title: node.name,
          icon: node.icon ?? "",
          hidden: node.visible === 0,
          keepAlive: node.keepAlive === 1 || undefined,
          externalUrl,
        },
      };

      if (node.redirect) route.redirect = node.redirect;
      if (node.children?.length) route.children = toRoutes(node.children);
      return route;
    });
}

/**
 * 动态路由数据，取自当前菜单表
 */
export function getMenuRoutes(): RouteItem[] {
  return toRoutes(MENU_TABLE as unknown as MenuNode[]);
}

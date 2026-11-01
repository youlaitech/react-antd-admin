import { create } from "zustand";

import MenuAPI from "@/api/system/menu";
import type { RouteItem } from "@/api/system/menu";
import { useRealtimeStore } from "./realtime";
import { useUserStore } from "./user";

// 菜单变更后可能有多处同时触发重建，共用一个进行中的请求
let pendingReload: Promise<RouteItem[]> | null = null;
// 多个 403 同时触发权限刷新时，共用一个进行中的请求
let pendingRefresh: Promise<void> | null = null;

interface PermissionState {
  /** 后端返回的菜单路由数据 */
  menuRoutes: RouteItem[];
  /** 动态路由是否已生成 */
  isRouteGenerated: boolean;
  /** 混合布局下顶栏激活的一级菜单路径 */
  activeTopMenuPath: string;
  /**
   * 拉取并生成动态路由
   */
  generateRoutes: () => Promise<RouteItem[]>;
  /**
   * 设置顶栏激活的一级菜单
   */
  setActiveTopMenuPath: (path: string) => void;
  /**
   * 重置路由状态
   */
  resetRouter: () => void;
  /**
   * 重新拉取用户信息后重建动态路由
   */
  refreshPermissions: () => Promise<void>;
  /**
   * 重新拉取菜单数据，让侧边栏与页面立即生效
   */
  reloadRoutes: () => Promise<RouteItem[]>;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  menuRoutes: [],
  isRouteGenerated: false,
  activeTopMenuPath: "",

  generateRoutes: () => {
    if (pendingReload) return pendingReload;

    pendingReload = MenuAPI.getRoutes()
      .then((menuRoutes) => {
        set({ menuRoutes, isRouteGenerated: true });
        return menuRoutes;
      })
      .finally(() => {
        pendingReload = null;
      });

    return pendingReload;
  },

  setActiveTopMenuPath: (activeTopMenuPath) => set({ activeTopMenuPath }),

  resetRouter: () => {
    set({ menuRoutes: [], isRouteGenerated: false, activeTopMenuPath: "" });
  },

  refreshPermissions: () => {
    if (pendingRefresh) return pendingRefresh;

    pendingRefresh = (async () => {
      await useUserStore.getState().getUserInfo();
      await get().generateRoutes();
      // 权限变化会影响实时订阅主题（如在线统计），按新权限重建连接
      useRealtimeStore.getState().start(() => useUserStore.getState().userInfo);
    })().finally(() => {
      pendingRefresh = null;
    });

    return pendingRefresh;
  },

  reloadRoutes: () => get().generateRoutes(),
}));

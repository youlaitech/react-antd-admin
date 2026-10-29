import { useEffect, useState, type PropsWithChildren } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import PageLoading from "@/components/PageLoading";
import { HOME_PATH, LOGIN_PATH, WHITE_LIST } from "@/constants";
import { usePermissionStore } from "@/stores/permission";
import { useRealtimeStore } from "@/stores/realtime";
import { useUserStore } from "@/stores/user";
import { AuthStorage } from "@/utils/auth";

/**
 * 判断是否命中免登录白名单
 */
function isWhitelisted(pathname: string): boolean {
  return WHITE_LIST.some((item) => pathname === item || pathname.startsWith(`${item}/`));
}

/**
 * 路由守卫
 */
export default function RouteGuard({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      const { pathname, search } = location;
      const isLoggedIn = !!AuthStorage.getAccessToken();

      // 未登录：白名单直接放行，其余跳转登录页并记住来源地址
      if (!isLoggedIn) {
        if (isWhitelisted(pathname)) {
          setReady(true);
          return;
        }
        navigate(`${LOGIN_PATH}?redirect=${encodeURIComponent(pathname + search)}`, {
          replace: true,
        });
        return;
      }

      // 已登录仍访问登录页：回到首页
      if (pathname === LOGIN_PATH) {
        navigate(HOME_PATH, { replace: true });
        return;
      }

      // 刷新进来时路由尚未生成，需要补齐用户信息与动态路由后再放行
      const { userInfo, getUserInfo } = useUserStore.getState();
      const permissionStore = usePermissionStore.getState();

      if (!permissionStore.isRouteGenerated) {
        setReady(false);
        try {
          if (!userInfo.roles?.length) {
            await getUserInfo();
          }
          await permissionStore.generateRoutes();

          // 登录态确立后再建连：未登录时领不到票据，建连只会空转
          useRealtimeStore.getState().start(() => useUserStore.getState().userInfo);
        } catch {
          await useUserStore.getState().redirectToLogin();
          return;
        }
      }

      if (!cancelled) setReady(true);
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [location, navigate]);

  if (!ready) {
    return <PageLoading />;
  }

  return <>{children}</>;
}

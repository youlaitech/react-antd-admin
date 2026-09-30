import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";

import BasicLayout from "@/layouts";
import { HOME_PATH, LOGIN_PATH } from "@/constants";

// 页面统一按路由分包，避免首屏加载全部页面代码
const Login = lazy(() => import("@/views/login"));
const Dashboard = lazy(() => import("@/views/dashboard"));
const Profile = lazy(() => import("@/views/profile"));
const MyNotice = lazy(() => import("@/views/profile/notice"));
const Detail = lazy(() => import("@/views/demo/route/detail"));
const RouteExampleEdit = lazy(() => import("@/views/demo/route/navigate/edit"));
const Forbidden = lazy(() => import("@/views/error/401"));
const NotFound = lazy(() => import("@/views/error/404"));
const DataScreen = lazy(() => import("@/views/data-screen"));

/**
 * 静态路由
 */
export const constantRoutes: RouteObject[] = [
  {
    path: LOGIN_PATH,
    element: <Login />,
  },
  {
    // 数据大屏：布局外整页铺满视口，菜单以站内外链形式在新标签页打开
    path: "/data-screen",
    element: <DataScreen />,
  },
  {
    path: "/",
    element: <BasicLayout />,
    children: [
      { index: true, element: <Navigate to={HOME_PATH} replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "profile", element: <Profile /> },
      // 我的通知只从顶栏通知中心的「查看更多」进入，不进侧边栏菜单
      { path: "profile/notice", element: <MyNotice /> },
      // 详情页不在菜单里，由多级菜单的按钮带参数跳进来
      { path: "detail/:id", element: <Detail /> },
      // 跳转演示的编辑页同样不占菜单，由列表页携 ID 跳转打开
      { path: "route-example/edit/:id", element: <RouteExampleEdit /> },
      { path: "401", element: <Forbidden /> },
      { path: "404", element: <NotFound /> },
    ],
  },
];

/**
 * 兜底路由
 * 必须排在动态路由之后，否则动态路由未注册时匹配不到页面
 */
export const fallbackRoute: RouteObject = { path: "*", element: <NotFound /> };

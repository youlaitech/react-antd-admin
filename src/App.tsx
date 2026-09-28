import { Suspense, useEffect, useMemo } from "react";
import { useRoutes } from "react-router-dom";
import { App as AntdApp, ConfigProvider, theme as antdTheme } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";

import PageLoading from "@/components/PageLoading";
import { LanguageEnum, SidebarColor } from "@/enums";
import { useThemeDark } from "@/hooks/useThemeDark";
import RouteGuard from "@/router/guard";
import { constantRoutes, fallbackRoute } from "@/router/routes";
import { transformRoutes } from "@/router/transform";
import { useAppStore } from "@/stores/app";
import { usePermissionStore } from "@/stores/permission";
import { setFeedbackApi } from "@/utils/feedback";

/**
 * 把 antd 的提示实例注入工具层
 * 拦截器、Store 等组件外场景无法调用 useApp()，需要在这里取实例后注入
 */
function FeedbackBridge() {
  const feedbackApi = AntdApp.useApp();

  useEffect(() => {
    setFeedbackApi(feedbackApi);
  }, [feedbackApi]);

  return null;
}

/** 路由出口 */
function AppRoutes() {
  const menuRoutes = usePermissionStore((state) => state.menuRoutes);

  const routes = useMemo(
    () => [...constantRoutes, ...transformRoutes(menuRoutes), fallbackRoute],
    [menuRoutes]
  );

  return useRoutes(routes);
}

export default function App() {
  const themeColors = useAppStore((state) => state.themeColors);
  const language = useAppStore((state) => state.language);
  const sidebarColor = useAppStore((state) => state.sidebarColor);
  const grayMode = useAppStore((state) => state.grayMode);
  const colorWeak = useAppStore((state) => state.colorWeak);

  const isDark = useThemeDark();

  // 主题变化时同步到 html，供自定义样式与浏览器原生控件识别
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }, [isDark]);

  // 侧边栏配色对应 theme.scss 中的变量集
  useEffect(() => {
    document.documentElement.classList.toggle(
      "sidebar-color-blue",
      sidebarColor === SidebarColor.CLASSIC_BLUE
    );
  }, [sidebarColor]);

  // 灰色模式与色弱模式直接作用在根元素，覆盖包括 antd 弹层在内的全部内容
  useEffect(() => {
    document.documentElement.style.filter = grayMode ? "grayscale(100%)" : "";
  }, [grayMode]);

  useEffect(() => {
    document.documentElement.classList.toggle("color-weak", colorWeak);
  }, [colorWeak]);

  const locale = language === LanguageEnum.EN_US ? enUS : zhCN;
  const algorithm = isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;

  return (
    <ConfigProvider
      locale={locale}
      theme={{
        algorithm,
        token: {
          colorPrimary: themeColors.primary,
          colorSuccess: themeColors.success,
          colorWarning: themeColors.warning,
          colorError: themeColors.danger,
          colorInfo: themeColors.info,
        },
        components: {
          // 侧边栏底色走项目变量，明暗主题自动切换
          Layout: { siderBg: "var(--menu-background)" },
          // antd 默认图标间距是 10，中文字形较满，收窄一档更紧凑
          Menu: { iconMarginInlineEnd: 8 },
          // 文字按钮默认取正文色（0.88 黑）渲染图标，压到图标色一档，悬浮给主题色
          Button: {
            textTextColor: "var(--ant-color-icon)",
            textTextHoverColor: "var(--ant-color-primary)",
          },
        },
      }}
    >
      <AntdApp>
        <FeedbackBridge />
        <RouteGuard>
          {/* 登录页等布局外的懒加载页面需要顶层 Suspense 兜底 */}
          <Suspense fallback={<PageLoading />}>
            <AppRoutes />
          </Suspense>
        </RouteGuard>
      </AntdApp>
    </ConfigProvider>
  );
}

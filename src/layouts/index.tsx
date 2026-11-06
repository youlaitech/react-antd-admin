import { ConfigProvider, Layout, Watermark } from "antd";
import { useOutlet } from "react-router-dom";

import { LayoutMode } from "@/enums";
import { useRegisterVisitedView } from "@/hooks/useRegisterVisitedView";
import { appConfig } from "@/settings";
import { useAppStore } from "@/stores/app";
import AppMain from "./components/AppMain";
import DoubleSidebar from "./components/DoubleSidebar";
import Navbar from "./components/Navbar";
import Settings from "./components/Settings";
import Sidebar from "./components/Sidebar";
import TagsView from "./components/TagsView";

// 侧栏宽度（px），Layout.Sider 的宽度参数只接受数值
// 双列一级栏宽度同时被 layout.scss 引用，取 variables.scss 的 $sidebar-primary-width
const SIDEBAR_WIDTH = 210;
const SIDEBAR_COLLAPSED_WIDTH = 54;
const DOUBLE_PRIMARY_WIDTH = 76;
const DOUBLE_SECONDARY_WIDTH = 210;

/**
 * 管理端基础布局
 */
export default function BasicLayout() {
  // 当前匹配到的子路由元素，必须用 useOutlet 取具体元素而非渲染 Outlet
  const outlet = useOutlet();

  const collapsed = useAppStore((state) => state.collapsed);
  const showTagsView = useAppStore((state) => state.showTagsView);
  const layout = useAppStore((state) => state.layout);
  const contentFullscreen = useAppStore((state) => state.contentFullscreen);
  const showWatermark = useAppStore((state) => state.showWatermark);

  // 页签登记与页签栏解耦，关闭多页签后页面缓存仍然生效
  useRegisterVisitedView();

  const isDouble = layout === LayoutMode.DOUBLE;
  // 内容全屏时侧边栏让位，顶栏隐藏
  const showSider = layout !== LayoutMode.TOP && !contentFullscreen;

  const siderWidth = isDouble ? DOUBLE_PRIMARY_WIDTH + DOUBLE_SECONDARY_WIDTH : SIDEBAR_WIDTH;
  // 双列布局折叠后保留一级图标栏
  const siderCollapsedWidth = isDouble ? DOUBLE_PRIMARY_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  const layoutNode = (
    <Layout className="wh-full">
      {showSider && (
        <Layout.Sider
          width={siderWidth}
          collapsedWidth={siderCollapsedWidth}
          collapsed={collapsed}
          trigger={null}
          className="app-sider"
        >
          {/*
            侧边栏菜单配色走 Menu 组件 token，而不是在外面用 CSS 覆盖。
            antd 的样式由 CSS-in-JS 运行时注入，构建期样式在层叠上不占优，
            token 是它认可的入口，也避免影响顶栏那份菜单
          */}
          <ConfigProvider
            theme={{
              components: {
                Menu: {
                  itemBg: "transparent",
                  subMenuItemBg: "transparent",
                  itemColor: "var(--menu-text)",
                  itemHoverColor: "var(--menu-active-text)",
                  itemHoverBg: "var(--menu-hover)",
                  itemSelectedColor: "var(--menu-active-text)",
                  itemSelectedBg: "var(--menu-active-bg)",
                },
              },
            }}
          >
            {isDouble ? <DoubleSidebar /> : <Sidebar />}
          </ConfigProvider>
        </Layout.Sider>
      )}

      <Layout className="overflow-hidden">
        <Navbar hidden={contentFullscreen} />
        {showTagsView && <TagsView />}
        <AppMain>{outlet}</AppMain>
      </Layout>

      <Settings />
    </Layout>
  );

  // 水印容器始终存在，切换时只改内容，避免根节点类型变化卸载整棵布局树
  return (
    <Watermark content={showWatermark ? appConfig.name : ""} className="wh-full">
      {layoutNode}
    </Watermark>
  );
}

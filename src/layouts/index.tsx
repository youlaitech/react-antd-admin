import { ConfigProvider, Layout, Watermark } from "antd";
import { useOutlet } from "react-router-dom";

import { LayoutMode } from "@/enums";
import { appConfig } from "@/settings";
import { useAppStore } from "@/stores/app";
import AppMain from "./components/AppMain";
import DoubleSidebar from "./components/DoubleSidebar";
import Navbar from "./components/Navbar";
import Settings from "./components/Settings";
import Sidebar from "./components/Sidebar";
import TagsView from "./components/TagsView";

// 双列布局的一级图标栏与子菜单栏宽度
const DOUBLE_PRIMARY_WIDTH = 76;
const DOUBLE_SECONDARY_WIDTH = 210;
// 单列侧边栏折叠后的宽度，与 variables.scss 的 $sidebar-width-collapsed 一致
const SIDEBAR_COLLAPSED_WIDTH = 54;

/** 管理端基础布局 */
export default function BasicLayout() {
  /** 当前匹配到的子路由元素，必须用 useOutlet 取具体元素而非渲染 Outlet */
  const outlet = useOutlet();

  const collapsed = useAppStore((state) => state.collapsed);
  const showTagsView = useAppStore((state) => state.showTagsView);
  const layout = useAppStore((state) => state.layout);
  const showWatermark = useAppStore((state) => state.showWatermark);

  const isDouble = layout === LayoutMode.DOUBLE;
  const showSider = layout !== LayoutMode.TOP;

  const siderWidth = isDouble ? DOUBLE_PRIMARY_WIDTH + DOUBLE_SECONDARY_WIDTH : 210;
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
        <Navbar />
        {showTagsView && <TagsView />}
        <AppMain>{outlet}</AppMain>
      </Layout>

      <Settings />
    </Layout>
  );

  if (!showWatermark) {
    return layoutNode;
  }

  return (
    <Watermark content={appConfig.name} className="wh-full">
      {layoutNode}
    </Watermark>
  );
}

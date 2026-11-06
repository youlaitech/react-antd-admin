import type { PropsWithChildren } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

interface PageAsideProps {
  /** 是否收起 */
  collapsed: boolean;
  /** 切换收起状态 */
  onToggle: () => void;
  /** 收起时按钮的提示文案 */
  expandText: string;
  /** 展开时按钮的提示文案 */
  collapseText: string;
}

/**
 * 页面左侧栏，带收起与展开切换
 */
export default function PageAside({
  collapsed,
  onToggle,
  expandText,
  collapseText,
  children,
}: PropsWithChildren<PageAsideProps>) {
  return (
    <aside className={`page-aside${collapsed ? " is-collapsed" : ""}`}>
      <div className="page-aside__inner">{children}</div>

      <button
        className="page-aside__toggle"
        type="button"
        title={collapsed ? expandText : collapseText}
        onClick={onToggle}
      >
        {collapsed ? <RightOutlined /> : <LeftOutlined />}
      </button>
    </aside>
  );
}

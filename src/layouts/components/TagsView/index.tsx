import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Dropdown, Tooltip, type MenuProps } from "antd";
import {
  CloseOutlined,
  DownOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";

import MenuIcon from "@/components/MenuIcon";
import { HOME_PATH } from "@/constants";
import { resolveRouteInfo } from "@/router/menu";
import { useAppStore } from "@/stores/app";
import { usePermissionStore } from "@/stores/permission";
import { useTagsViewStore } from "@/stores/tagsView";

/** 常驻页签 */
const AFFIX_PATHS = new Set([HOME_PATH]);

/**
 * 多页签
 */
export default function TagsView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const menuRoutes = usePermissionStore((state) => state.menuRoutes);
  const visitedViews = useTagsViewStore((state) => state.visitedViews);
  const tagsViewStyle = useAppStore((state) => state.tagsViewStyle);
  const contentFullscreen = useAppStore((state) => state.contentFullscreen);
  const toggleContentFullscreen = useAppStore((state) => state.toggleContentFullscreen);
  const {
    addView,
    delView,
    delOthersViews,
    delLeftViews,
    delRightViews,
    delAllViews,
    refreshView,
  } = useTagsViewStore(
    useShallow((state) => ({
      addView: state.addView,
      delView: state.delView,
      delOthersViews: state.delOthersViews,
      delLeftViews: state.delLeftViews,
      delRightViews: state.delRightViews,
      delAllViews: state.delAllViews,
      refreshView: state.refreshView,
    }))
  );

  // 路由变化时登记页签，标题与图标优先取后端菜单，静态路由回退到本地配置
  useEffect(() => {
    const { title, icon, keepAlive } = resolveRouteInfo(pathname, menuRoutes, t);
    if (title) {
      addView({ path: pathname, title, icon, affix: AFFIX_PATHS.has(pathname), keepAlive });
    }
  }, [pathname, menuRoutes, t, addView]);

  /**
   * 刷新页签
   */
  function refresh(path: string) {
    refreshView(path);
    if (path !== pathname) navigate(path);
  }

  /**
   * 关闭页签
   */
  function closeTag(path: string) {
    const closedIndex = visitedViews.findIndex((view) => view.path === path);
    const restViews = delView(path);

    if (path !== pathname) return;

    const nextView = restViews[closedIndex] ?? restViews[closedIndex - 1] ?? restViews[0];
    navigate(nextView?.path ?? HOME_PATH, { replace: true });
  }

  /**
   * 关闭其他页签，当前页被一并关掉时回到目标页
   */
  function closeOthers(path: string) {
    delOthersViews(path);

    if (path !== pathname) {
      navigate(path, { replace: true });
    }
  }

  /**
   * 关闭指定方向上的页签，当前页被关掉时退到剩余页签的末尾
   */
  function closeDirection(direction: "left" | "right", path: string) {
    const restViews = direction === "left" ? delLeftViews(path) : delRightViews(path);

    if (!restViews.some((view) => view.path === pathname)) {
      navigate(restViews[restViews.length - 1]?.path ?? HOME_PATH, { replace: true });
    }
  }

  /**
   * 关闭全部页签并回到首页
   */
  function closeAll() {
    delAllViews();
    navigate(HOME_PATH, { replace: true });
  }

  /**
   * 批量操作项，页签右键菜单与右侧下拉共用
   */
  function buildActions(path: string): MenuProps["items"] {
    return [
      { key: "refresh", label: t("tagsView.refresh"), onClick: () => refresh(path) },
      { type: "divider" },
      {
        key: "closeCurrent",
        label: t("tagsView.close"),
        disabled: AFFIX_PATHS.has(path),
        onClick: () => closeTag(path),
      },
      { key: "closeOthers", label: t("tagsView.closeOthers"), onClick: () => closeOthers(path) },
      {
        key: "closeLeft",
        label: t("tagsView.closeLeft"),
        onClick: () => closeDirection("left", path),
      },
      {
        key: "closeRight",
        label: t("tagsView.closeRight"),
        onClick: () => closeDirection("right", path),
      },
      { type: "divider" },
      { key: "closeAll", label: t("tagsView.closeAll"), onClick: closeAll },
    ];
  }

  return (
    <div className={`app-tags-view app-tags-view--${tagsViewStyle}`}>
      <div className="app-tags-view__scroll">
        <div className="app-tags-view__list">
          {visitedViews.map((view) => (
            <Dropdown
              key={view.path}
              trigger={["contextMenu"]}
              menu={{ items: buildActions(view.path) }}
            >
              <div
                className={`app-tags-view__item${view.path === pathname ? " is-active" : ""}`}
                onClick={() => navigate(view.path)}
                onAuxClick={(event) => {
                  // 中键关闭，固定页签不响应
                  if (event.button !== 1 || view.affix) return;
                  event.preventDefault();
                  closeTag(view.path);
                }}
              >
                {view.icon && <MenuIcon icon={view.icon} />}
                <span className="app-tags-view__text">{view.title}</span>
                {!view.affix && (
                  <span
                    className="app-tags-view__close"
                    onClick={(event) => {
                      // 阻止冒泡，否则关闭的同时还会跳转到该页签
                      event.stopPropagation();
                      closeTag(view.path);
                    }}
                  >
                    <CloseOutlined />
                  </span>
                )}
              </div>
            </Dropdown>
          ))}
        </div>
      </div>

      <div className="app-tags-view__actions">
        <Tooltip
          title={
            contentFullscreen
              ? t("tagsView.exitContentFullscreen")
              : t("tagsView.contentFullscreen")
          }
        >
          <Button
            type="text"
            size="small"
            icon={contentFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleContentFullscreen}
          />
        </Tooltip>

        <Tooltip title={t("tagsView.refresh")}>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => refresh(pathname)}
          />
        </Tooltip>

        <Dropdown trigger={["click"]} menu={{ items: buildActions(pathname) }}>
          <Tooltip title={t("tagsView.actions")}>
            <Button type="text" size="small" icon={<DownOutlined />} />
          </Tooltip>
        </Dropdown>
      </div>
    </div>
  );
}

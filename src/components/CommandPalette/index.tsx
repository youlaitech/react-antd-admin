import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Empty, Input, Modal, type InputRef } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  EnterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { RouteItem } from "@/api/system/menu";
import { HOME_PATH } from "@/constants";
import { findMenuQuery } from "@/router/menu";
import { usePermissionStore } from "@/stores/permission";
import {
  navigateMenuKey,
  openExternalUrl,
  resolveMenuExternalUrl,
  resolveRoutePath,
} from "@/utils";

// 搜索历史存储键
const HISTORY_KEY = "menu_search_history";

// 搜索历史保留条数
const MAX_HISTORY = 5;

// 不参与搜索的路径
const EXCLUDED_PATHS = ["/login", "/401", "/404"];

/**
 * 命令面板可搜索的菜单项
 */
interface SearchItem {
  /** 菜单标题 */
  title: string;
  /** 访问路径，外链菜单为完整地址 */
  path: string;
  /** 是否外链菜单 */
  external: boolean;
}

/**
 * 把后端菜单拍平成可搜索项
 */
function flattenMenus(routes: RouteItem[], parentPath: string, list: SearchItem[]): SearchItem[] {
  routes.forEach((route) => {
    const title = route.meta?.title;
    if (!title || route.meta?.hidden) return;

    const externalUrl = resolveMenuExternalUrl(route);
    if (externalUrl) {
      list.push({ title, path: externalUrl, external: true });
      return;
    }

    const path = resolveRoutePath(parentPath, route.path ?? "");
    if (EXCLUDED_PATHS.includes(path)) return;

    if (route.children?.length) {
      flattenMenus(route.children, path, list);
      return;
    }

    list.push({ title, path, external: false });
  });

  return list;
}

/**
 * 命令面板：菜单搜索、历史记录与键盘导航
 */
export default function CommandPalette() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const menuRoutes = usePermissionStore((state) => state.menuRoutes);

  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [history, setHistory] = useState<SearchItem[]>([]);

  const inputRef = useRef<InputRef>(null);

  // 可搜索项：首页是静态路由，单独补一条
  const menuItems = useMemo(() => {
    const home: SearchItem = { title: t("menu.dashboard"), path: HOME_PATH, external: false };

    return [home, ...flattenMenus(menuRoutes, "", [])];
  }, [menuRoutes, t]);

  // 标题命中的菜单项
  const results = useMemo(() => {
    const text = keyword.trim().toLowerCase();

    return text ? menuItems.filter((item) => item.title.toLowerCase().includes(text)) : [];
  }, [keyword, menuItems]);

  // 有搜索结果时展示结果，否则展示历史记录
  const displayList = results.length > 0 ? results : history;

  // 打开面板并清空上一次的搜索状态
  const openPalette = useCallback(() => {
    setKeyword("");
    setActiveIndex(-1);
    setOpen(true);
  }, []);

  // 跳转到选中项并写入搜索历史
  const go = useCallback(
    (item: SearchItem) => {
      setOpen(false);

      const nextHistory = [
        item,
        ...history.filter((historyItem) => historyItem.path !== item.path),
      ].slice(0, MAX_HISTORY);
      setHistory(nextHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));

      // 外链菜单在新标签页打开，站内路径走路由
      if (item.external) {
        openExternalUrl(item.path);
        return;
      }

      navigateMenuKey(item.path, navigate, findMenuQuery(menuRoutes, item.path));
    },
    [history, menuRoutes, navigate],
  );

  // 上下键移动高亮项，到头后循环
  const moveActive = useCallback(
    (direction: "up" | "down") => {
      if (displayList.length === 0) return;

      setActiveIndex((prev) => {
        if (direction === "up") return prev <= 0 ? displayList.length - 1 : prev - 1;

        return prev >= displayList.length - 1 ? 0 : prev + 1;
      });
    },
    [displayList.length],
  );

  // 输入框键盘操作：上下选择、回车跳转、Esc 关闭
  const handleInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      const key = event.key.toLowerCase();

      if (key === "escape") {
        setOpen(false);
        return;
      }

      if (key === "arrowup" || key === "arrowdown") {
        event.preventDefault();
        moveActive(key === "arrowup" ? "up" : "down");
        return;
      }

      if (key === "enter") {
        event.preventDefault();

        const target = displayList[activeIndex < 0 ? 0 : activeIndex];
        if (target) go(target);
      }
    },
    [activeIndex, displayList, go, moveActive],
  );

  // 读取搜索历史
  useEffect(() => {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      setHistory(data ? (JSON.parse(data) as SearchItem[]) : []);
    } catch {
      setHistory([]);
    }
  }, []);

  // Ctrl/Cmd + K 打开面板，并阻止浏览器默认搜索
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      }
    };

    document.addEventListener("keydown", handleKeydown);

    return () => document.removeEventListener("keydown", handleKeydown);
  }, [openPalette]);

  return (
    <>
      <div
        className="command-palette__trigger"
        role="button"
        tabIndex={0}
        aria-label={t("commandPalette.title")}
        onClick={openPalette}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;

          event.preventDefault();
          openPalette();
        }}
      >
        <SearchOutlined className="command-palette__trigger-icon" />
        <span className="command-palette__trigger-text">{t("commandPalette.title")}</span>
        <kbd className="command-palette__kbd">Ctrl K</kbd>
      </div>

      <Modal
        width={720}
        centered
        open={open}
        footer={null}
        closable={false}
        destroyOnHidden
        onCancel={() => setOpen(false)}
        afterOpenChange={(visible) => {
          if (visible) inputRef.current?.focus();
        }}
      >
        <div className="command-palette">
          <Input
            ref={inputRef}
            size="large"
            allowClear
            value={keyword}
            prefix={<SearchOutlined />}
            placeholder={t("commandPalette.placeholder")}
            onChange={(event) => {
              setKeyword(event.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleInputKeyDown}
          />

          <div className="command-palette__results">
            {displayList.length === 0 ? (
              <Empty
                className="command-palette__empty"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("commandPalette.empty")}
              />
            ) : (
              displayList.map((item, index) => (
                <div
                  key={`${item.path}-${index}`}
                  className={`command-palette__item${activeIndex === index ? " is-active" : ""}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => go(item)}
                >
                  <span className="command-palette__item-title">{item.title}</span>
                  <span className="command-palette__item-path">{item.path}</span>
                </div>
              ))
            )}
          </div>

          <div className="command-palette__hints">
            <span className="command-palette__hint">
              <kbd className="command-palette__kbd">
                <ArrowUpOutlined />
              </kbd>
              <kbd className="command-palette__kbd">
                <ArrowDownOutlined />
              </kbd>
              {t("commandPalette.hintSwitch")}
            </span>
            <span className="command-palette__hint">
              <kbd className="command-palette__kbd">
                <EnterOutlined />
              </kbd>
              {t("commandPalette.hintSelect")}
            </span>
            <span className="command-palette__hint">
              <kbd className="command-palette__kbd">Esc</kbd>
              {t("commandPalette.hintClose")}
            </span>
          </div>
        </div>
      </Modal>
    </>
  );
}

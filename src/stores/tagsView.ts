import { create } from "zustand";

/**
 * 页签项
 */
export interface TagItem {
  /** 路由路径 */
  path: string;
  /** 页签标题 */
  title: string;
  /** 页签图标，取后端菜单的 icon */
  icon?: string;
  /** 是否固定，不可关闭 */
  affix?: boolean;
  /** 是否开启页面缓存 */
  keepAlive?: boolean;
}

interface TagsViewState {
  /** 已打开的页签 */
  visitedViews: TagItem[];
  /** 页面刷新版本号 */
  viewVersions: Record<string, number>;
  /** 自定义页签标题 */
  customTitles: Record<string, string>;
  /**
   * 刷新指定页签
   */
  refreshView: (path: string) => void;
  /**
   * 改写指定页签的标题，常用于详情页把标题换成带参数的描述
   */
  setViewTitle: (path: string, title: string) => void;
  /**
   * 打开页签
   */
  addView: (view: TagItem) => void;
  /**
   * 关闭页签，返回剩余页签
   */
  delView: (path: string) => TagItem[];
  /**
   * 关闭其他页签，返回剩余页签
   */
  delOthersViews: (path: string) => TagItem[];
  /**
   * 关闭左侧页签，返回剩余页签
   */
  delLeftViews: (path: string) => TagItem[];
  /**
   * 关闭右侧页签，返回剩余页签
   */
  delRightViews: (path: string) => TagItem[];
  /**
   * 关闭全部页签，返回剩余页签
   */
  delAllViews: () => TagItem[];
}

export const useTagsViewStore = create<TagsViewState>((set, get) => {
  /**
   * 写入并回传剩余页签
   * 关闭动作会连带影响跳转目标，调用方必须知道关完之后还剩哪些页签，所以这里统一回传
   */
  function commit(visitedViews: TagItem[]) {
    const kept = new Set(visitedViews.map((item) => item.path));
    const customTitles: Record<string, string> = {};
    Object.entries(get().customTitles).forEach(([path, title]) => {
      if (kept.has(path)) customTitles[path] = title;
    });

    set({ visitedViews, customTitles });
    return visitedViews;
  }

  /**
   * 查找页签下标，未找到时返回 -1
   */
  function indexOf(path: string) {
    return get().visitedViews.findIndex((item) => item.path === path);
  }

  return {
    visitedViews: [],
    viewVersions: {},
    customTitles: {},

    refreshView: (path) =>
      set((state) => ({
        viewVersions: { ...state.viewVersions, [path]: (state.viewVersions[path] ?? 0) + 1 },
      })),

    setViewTitle: (path, title) =>
      set((state) => ({
        customTitles: { ...state.customTitles, [path]: title },
        visitedViews: state.visitedViews.map((item) =>
          item.path === path ? { ...item, title } : item,
        ),
      })),

    addView: (view) => {
      const { visitedViews, customTitles } = get();
      if (visitedViews.some((item) => item.path === view.path)) return;

      const title = customTitles[view.path] ?? view.title;
      set({ visitedViews: [...visitedViews, { ...view, title }] });
    },

    delView: (path) =>
      commit(get().visitedViews.filter((item) => item.path !== path || item.affix)),

    delOthersViews: (path) =>
      commit(get().visitedViews.filter((item) => item.affix || item.path === path)),

    delLeftViews: (path) => {
      const { visitedViews } = get();
      const index = indexOf(path);
      if (index < 0) return visitedViews;
      return commit(visitedViews.filter((item, i) => i >= index || item.affix));
    },

    delRightViews: (path) => {
      const { visitedViews } = get();
      const index = indexOf(path);
      if (index < 0) return visitedViews;
      return commit(visitedViews.filter((item, i) => i <= index || item.affix));
    },

    delAllViews: () => commit(get().visitedViews.filter((item) => item.affix)),
  };
});

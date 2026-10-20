import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { Layout } from "antd";
import { useLocation } from "react-router-dom";

import PageLoading from "@/components/PageLoading";
import { PageSwitchingAnimation } from "@/enums";
import { useAppStore } from "@/stores/app";
import { useTagsViewStore } from "@/stores/tagsView";

/** 内容区 */
export default function AppMain({ children }: PropsWithChildren) {
  const location = useLocation();
  const animation = useAppStore((state) => state.pageSwitchingAnimation);
  const visitedViews = useTagsViewStore((state) => state.visitedViews);
  const viewVersions = useTagsViewStore((state) => state.viewVersions);

  const animated = animation !== PageSwitchingAnimation.NONE;
  /** 缓存按完整访问地址归集，同一路径的不同参数各自保留一份状态 */
  const activeKey = location.pathname + location.search;

  /** 开启缓存的页签路径集合 */
  const cachedPaths = useMemo(
    () => new Set(visitedViews.filter((view) => view.keepAlive).map((view) => view.path)),
    [visitedViews]
  );

  /** 缓存池：key 为完整访问地址，值为该次访问的页面元素 */
  const cacheRef = useRef(new Map<string, ReactNode>());

  const shouldCache = cachedPaths.has(location.pathname);

  // 首次进入即写入缓存，属于幂等的惰性初始化，不能挪到 effect：挪走后首帧拿不到缓存节点，页面会重建一次
  if (shouldCache && !cacheRef.current.has(activeKey)) {
    cacheRef.current.set(activeKey, children);
  }

  // 渲染阶段只读缓存，页签关闭后的清理放到 effect，避免在渲染期删除数据
  const cachedEntries = [...cacheRef.current.entries()].filter(
    ([key]) => key === activeKey || cachedPaths.has(key.split("?")[0])
  );

  useEffect(() => {
    cacheRef.current.forEach((_, key) => {
      if (key !== activeKey && !cachedPaths.has(key.split("?")[0])) {
        cacheRef.current.delete(key);
      }
    });
  }, [activeKey, cachedPaths]);

  return (
    <Layout.Content className="app-main">
      <Suspense fallback={<PageLoading />}>
        {/* 缓存页常驻渲染，非激活的隐藏，因此离开当前页也不会卸载 */}
        {cachedEntries.map(([key, node]) => (
          <div
            // 刷新版本并进 key：版本一变 React 就销毁旧实例、按缓存元素重建，
            // 页面重新挂载并重新取数，无需整页 reload
            key={`${key}#${viewVersions[key.split("?")[0]] ?? 0}`}
            className="app-main__view"
            style={key === activeKey ? undefined : { display: "none" }}
          >
            {node}
          </div>
        ))}

        {!shouldCache && (
          <div
            // 非缓存页同样按版本重建，保证「刷新当前」对两类页面行为一致
            key={`${location.pathname}#${viewVersions[location.pathname] ?? 0}`}
            className={animated ? `app-main__view is-${animation}` : undefined}
          >
            {children}
          </div>
        )}
      </Suspense>
    </Layout.Content>
  );
}

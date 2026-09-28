import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/** 页面从后台切回前台时执行回调 */
export function usePageActivate(onActivate: () => void) {
  const location = useLocation();
  // 挂载时正在渲染本页，此时拿到的路径就是本页自己的路径
  const ownPathRef = useRef(location.pathname);
  const isActive = location.pathname === ownPathRef.current;
  const isActiveRef = useRef(isActive);

  // 回调每次渲染都是新引用，用 ref 承接避免反复触发下面的 effect
  const onActivateRef = useRef(onActivate);
  onActivateRef.current = onActivate;

  useEffect(() => {
    if (isActive && !isActiveRef.current) {
      onActivateRef.current();
    }
    isActiveRef.current = isActive;
  }, [isActive]);
}

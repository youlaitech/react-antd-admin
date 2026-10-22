import { useEffect, useRef } from "react";

/** 设计稿宽度 */
const DESIGN_WIDTH = 1920;

/** 设计稿高度 */
const DESIGN_HEIGHT = 1080;

/**
 * 大屏适配：元素固定为设计稿尺寸后等比缩放，版式不随窗口比例变形
 *
 * @returns 绑定到适配容器的 ref
 */
export function useFitScreen() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    Object.assign(el.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      zIndex: "999",
      width: `${DESIGN_WIDTH}px`,
      height: `${DESIGN_HEIGHT}px`,
      transformOrigin: "top left",
      transition: "all 0.3s",
    });

    const resize = () => {
      const scale = Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT);
      el.style.transform = `scale(${scale}) translate(-50%, -50%)`;
    };

    resize();
    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, []);

  return containerRef;
}

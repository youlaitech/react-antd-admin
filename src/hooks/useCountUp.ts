import { useEffect, useRef, useState } from "react";

/** 数字滚动时长 */
const DEFAULT_DURATION = 800;

/** 数字滚动 */
export function useCountUp(target: number, duration = DEFAULT_DURATION) {
  const [value, setValue] = useState(0);
  // 记录当前显示值，中途被打断时能从当前位置接着走
  const currentRef = useRef(0);

  useEffect(() => {
    const from = currentRef.current;
    if (from === target) return;

    const startTime = performance.now();
    let frameId = 0;

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // easeOutCubic：起步快、收尾慢
      const eased = 1 - (1 - progress) ** 3;
      const next = from + (target - from) * eased;

      currentRef.current = next;
      setValue(Math.round(next));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        currentRef.current = target;
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return value;
}

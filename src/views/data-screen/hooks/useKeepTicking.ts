import { useEffect, useRef } from "react";

/**
 * 常驻定时器：组件存活期间按固定间隔执行回调，页面隐藏时自动暂停
 *
 * @param callback 定时器每次触发时执行的回调
 * @param interval 间隔毫秒数，默认 3000
 */
export function useKeepTicking(callback: () => void, interval = 3000) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let timerId: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timerId === null) {
        timerId = setInterval(() => callbackRef.current(), interval);
      }
    };

    const stop = () => {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    start();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stop();
    };
  }, [interval]);
}

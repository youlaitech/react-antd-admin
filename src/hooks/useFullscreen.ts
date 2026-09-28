import { useCallback, useEffect, useState, type RefObject } from "react";

/** 全屏状态与切换 */
export function useFullscreen(targetRef?: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }

    const target = targetRef?.current ?? document.documentElement;
    target.requestFullscreen();
  }, [targetRef]);

  return { isFullscreen, toggleFullscreen };
}

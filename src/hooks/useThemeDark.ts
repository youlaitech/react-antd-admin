import { useEffect, useState } from "react";

import { ThemeMode } from "@/enums";
import { useAppStore } from "@/stores/app";

/** 系统偏好暗色的媒体查询 */
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

/** 当前是否处于暗色主题 */
export function useThemeDark() {
  const theme = useAppStore((state) => state.theme);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(DARK_MEDIA_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(DARK_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);

    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return theme === ThemeMode.DARK || (theme === ThemeMode.AUTO && systemDark);
}

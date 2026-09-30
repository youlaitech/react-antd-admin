import { useEffect } from "react";
import { App } from "antd";

/**
 * 版本更新提示
 * 定时拉取 version.json，与构建时间戳比对后提示用户刷新
 */
export default function VersionUpdateNotice() {
  const { notification } = App.useApp();

  useEffect(() => {
    // 开发态无构建产物，不做检测
    if (import.meta.env.DEV) return;

    let notified = false;

    const showNotice = () => {
      if (notified) return;
      notified = true;

      // 使用通知而非模态框，不打断用户操作
      notification.info({
        message: "🎉 发现新版本",
        description: "系统已更新，点击刷新以获取最新功能",
        duration: 0, // 不自动关闭
        placement: "bottomRight",
        onClick: () => window.location.reload(),
        onClose: () => {
          notified = false;
        },
      });
    };

    const checkVersion = async () => {
      try {
        const base = import.meta.env.BASE_URL;
        const baseUrl = base.endsWith("/") ? base : `${base}/`;
        // 时间戳防 CDN/代理缓存，no-cache 防浏览器磁盘缓存
        const res = await fetch(`${baseUrl}version.json?t=${Date.now()}`, {
          cache: "no-cache",
        });
        if (!res.ok) return; // 非核心功能，网络异常不影响正常使用

        const data = await res.json();
        if (data.version && data.version !== __APP_INFO__.buildTimestamp) {
          showNotice();
        }
      } catch (error) {
        console.warn("版本检测失败", error);
      }
    };

    // 用户从其他标签页切回时立即检测，无需等待下一次轮询
    const handleVisibilityChange = () => {
      if (!document.hidden) checkVersion();
    };

    checkVersion();
    const timer = window.setInterval(checkVersion, 5 * 60_000);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [notification]);

  return null;
}

import { useEffect, useState } from "react";
import { Button, Tooltip } from "antd";
import { FullscreenOutlined } from "@ant-design/icons";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/** 数值补零为两位 */
const pad = (value: number) => String(value).padStart(2, "0");

interface ScreenHeaderProps {
  /** 主标题 */
  title: string;
  /** 英文副标题 */
  subtitle: string;
  /** 当前是否处于全屏，用于切换按钮提示 */
  isFullscreen: boolean;
  /** 切换全屏 */
  onToggleFullscreen: () => void;
}

interface ClockState {
  date: string;
  weekday: string;
  time: string;
}

/** 大屏顶部栏 */
export default function ScreenHeader({
  title,
  subtitle,
  isFullscreen,
  onToggleFullscreen,
}: ScreenHeaderProps) {
  const [clock, setClock] = useState<ClockState>({ date: "", weekday: "", time: "" });

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setClock({
        date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
        weekday: WEEKDAYS[now.getDay()],
        time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
      });
    }

    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="flex shrink-0 items-center gap-4">
      <div className="flex w-72 items-center">
        <div className="screen__clock">
          <span className="screen__clock-time">{clock.time}</span>
          <span className="screen__clock-divider" />
          <div className="screen__clock-meta">
            <span className="screen__clock-date">{clock.date}</span>
            <span className="screen__clock-week">{clock.weekday}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 text-center">
        <h1 className="screen__title m-0">{title}</h1>
        <p className="screen__subtitle m-0">{subtitle}</p>
      </div>

      <div className="flex w-72 items-center justify-end">
        <Tooltip title={isFullscreen ? "退出全屏" : "全屏查看"}>
          <Button
            className="screen__action"
            shape="circle"
            icon={<FullscreenOutlined />}
            onClick={onToggleFullscreen}
          />
        </Tooltip>
      </div>
    </header>
  );
}

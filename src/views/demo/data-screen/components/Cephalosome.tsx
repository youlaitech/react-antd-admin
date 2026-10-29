import { useEffect, useState } from "react";

import { useKeepTicking } from "../hooks/useKeepTicking";
import { parseTime } from "../utils/time";

/**
 * 当前时间文案
 */
function currentTime() {
  return parseTime(new Date(), "YYYY-MM-DD HH:mm:ss 周dd A ");
}

/**
 * 大屏头部：标题与实时时钟
 */
export default function Cephalosome() {
  const [dateTime, setDateTime] = useState("加载中...");

  useEffect(() => {
    setDateTime(currentTime());
  }, []);

  // 使用定时器钩子更新时间
  useKeepTicking(() => setDateTime(currentTime()), 1000);

  return (
    <div className="dataScreen-header">
      {/* 头部内容 */}
      <div className="flex-center h-full overflow-hidden">
        {/* 左侧内容 */}
        <div className="leftHead"></div>
        {/* 中间标题 */}
        <div className="title">新能源汽车联网平台数据概览</div>
        {/* 右侧内容 */}
        <div className="rightHead">
          {/* 实时时间 */}
          <div className="dateTime">{dateTime}</div>
        </div>
      </div>
      {/* 装饰线 */}
      <div className="lines" style={{ left: "10%" }} />
      <div className="lines" style={{ right: "10%", transform: "rotate(180deg)" }} />
      <div className="ray" />
    </div>
  );
}

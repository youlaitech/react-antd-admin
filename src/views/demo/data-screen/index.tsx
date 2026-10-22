import { useFitScreen } from "./hooks/useFitScreen";
import Cephalosome from "./components/Cephalosome";
import CenterCharts from "./components/CenterCharts";
import LeftCharts from "./components/LeftCharts";
import MapChart from "./components/MapChart";
import RightCharts from "./components/RightCharts";

import "./assets/styles/index.scss";

/**
 * 数据大屏：1920×1080 设计稿等比缩放，整页铺满视口
 */
export default function DataScreen() {
  const containerRef = useFitScreen();

  return (
    <div className="dataScreen-container">
      {/* 适配屏幕容器：按 1920×1080 设计稿等比缩放 */}
      <div ref={containerRef} className="pt-10px flex flex-col">
        {/* 头部区域 */}
        <Cephalosome />

        {/* 图表区域 */}
        <div className="flex-1 p-10px flex gap-[10px] relative">
          {/* 漂浮地图 */}
          <MapChart />
          {/* 左侧图表 */}
          <LeftCharts />
          {/* 中间图表 */}
          <CenterCharts />
          {/* 右侧图表 */}
          <RightCharts />
        </div>
      </div>
    </div>
  );
}

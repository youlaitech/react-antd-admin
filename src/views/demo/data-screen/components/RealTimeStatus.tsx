import { useEffect, useRef } from "react";
import type { EChartsOption, EChartsType } from "echarts";

import BaseChart, { type BaseChartRef } from "./BaseChart";
import { useKeepTicking } from "../hooks/useKeepTicking";

const data = [
  { value: 89.4, name: "在线率" },
  { value: 10.6, name: "离线率" },
];

const options: EChartsOption = {
  tooltip: { trigger: "item" },
  legend: {
    top: "center",
    right: "10%",
    orient: "vertical",
    textStyle: { color: "white" },
  },
  series: [
    {
      type: "pie",
      radius: ["60%", "80%"],
      center: ["40%", "50%"],
      startAngle: 90,
      data,
      label: { color: "white" },
    },
  ],
};

/**
 * 数字翻牌器
 */
const digitPanel = (
  <div className="pt-10px pb-8px">
    <div className="digital-display">
      <div className="digit-item">
        <span className="digit-value">12,580</span>
        <span className="digit-label">接入车辆总数</span>
      </div>
      <div className="digit-item">
        <span className="digit-value online">11,245</span>
        <span className="digit-label">在线车辆数</span>
      </div>
      <div className="digit-item">
        <span className="digit-value offline">1,335</span>
        <span className="digit-label">离线车辆数</span>
      </div>
    </div>
  </div>
);

/**
 * 车辆实时状态：在线率饼图与数字翻牌器
 */
export default function RealTimeStatus() {
  const chartRef = useRef<BaseChartRef>(null);
  const chartInstance = useRef<EChartsType | null>(null);
  const currentIndex = useRef(0);

  useEffect(() => {
    chartRef.current?.initOptions(options);
  }, []);

  useKeepTicking(() => {
    const chart = chartInstance.current;
    if (!chart) return;

    // 取消之前的高亮
    chart.dispatchAction({ type: "downplay" });

    chart.dispatchAction({
      type: "highlight",
      seriesIndex: 0,
      dataIndex: currentIndex.current,
    });

    // 更新索引
    currentIndex.current = (currentIndex.current + 1) % data.length;
  });

  return (
    <BaseChart
      ref={chartRef}
      className="h-300px"
      before={digitPanel}
      onLoad={(chart) => (chartInstance.current = chart)}
    />
  );
}

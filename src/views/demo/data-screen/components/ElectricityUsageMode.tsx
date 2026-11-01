import { useEffect, useRef, type CSSProperties } from "react";
import type { EChartsOption, EChartsType } from "echarts";

import BaseChart, { type BaseChartRef } from "./BaseChart";
import { useKeepTicking } from "../hooks/useKeepTicking";

const data = [
  { value: 1048, name: "快充", itemStyle: { color: "#00E676" } }, // 荧光绿
  { value: 835, name: "慢充", itemStyle: { color: "#FF4081" } }, // 玫红色
  { value: 515, name: "换电", itemStyle: { color: "#536DFE" } }, // 亮蓝色
  { value: 178, name: "其他", itemStyle: { color: "#FFD600" } }, // 黄色
];

const options: EChartsOption = {
  tooltip: { trigger: "item" },
  legend: {
    bottom: 0,
    left: "center",
    textStyle: { color: "white" },
  },
  series: [
    {
      type: "pie",
      radius: ["40%", "70%"],
      center: ["50%", "40%"],
      padAngle: 5,
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4 },
      label: { show: false, position: "center" },
      emphasis: {
        label: {
          show: true,
          color: "#fff",
          fontSize: 16,
          fontWeight: "bold",
        },
      },
      labelLine: { show: false },
      data,
    },
  ],
};

// 容器尺寸变量
const containerStyle = { "--height": "195px", "--width": "280px" } as CSSProperties;

/**
 * 用电方式占比：定位在充电统计图左上角外侧
 */
export default function ElectricityUsageMode() {
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
    <div className="electricityUsageMode" style={containerStyle}>
      <BaseChart ref={chartRef} onLoad={(chart) => (chartInstance.current = chart)} />
    </div>
  );
}

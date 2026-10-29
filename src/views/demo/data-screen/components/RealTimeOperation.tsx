import { useEffect, useRef } from "react";
import type { EChartsOption } from "echarts";

import BaseChart, { type BaseChartRef } from "./BaseChart";
import { useKeepTicking } from "../hooks/useKeepTicking";

/**
 * 生成24小时车速数据
 */
function buildSpeedData() {
  const data: number[] = [];

  for (let i = 0; i < 24; i++) {
    data.push(Math.random() * 30 + 40 + Math.sin((i / 24) * Math.PI * 2) * 10);
  }

  return data;
}

const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

const options: EChartsOption = {
  backgroundColor: "transparent",
  title: {
    text: "实时运行监控",
    textStyle: {
      color: "#fff",
      fontSize: 20,
      fontFamily: "YouSheBiaoTiHei,Arial,sans-serif",
      fontWeight: "normal",
    },
    top: 0,
    left: "center",
  },
  grid: {
    left: 0,
    right: "2%",
    top: "20%",
    bottom: 0,
  },
  xAxis: {
    type: "category",
    data: hours,
    axisLine: { lineStyle: { color: "rgba(0, 255, 255, 0.5)" } },
    axisLabel: { color: "#ffffff", fontSize: 10 },
  },
  yAxis: {
    type: "value",
    name: "km/h",
    nameTextStyle: { color: "#00ffff" },
    axisLine: { lineStyle: { color: "rgba(0, 255, 255, 0.5)" } },
    axisLabel: { color: "#ffffff" },
    splitLine: { lineStyle: { color: "rgba(0, 255, 255, 0.1)" } },
  },
  series: [
    {
      name: "平均车速",
      type: "line",
      data: buildSpeedData(),
      smooth: true,
      lineStyle: {
        color: "#00ff7f",
        width: 2,
      },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(0,202,149,0.5)" },
            { offset: 1, color: "rgba(0,202,149,0)" },
          ],
          global: false,
        },
        shadowColor: "rgba(0,202,149, 0.9)",
        shadowBlur: 20,
      },
    },
  ],
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(26, 35, 50, 0.9)",
    borderColor: "rgba(0, 255, 255, 0.5)",
    textStyle: { color: "#ffffff" },
  },
};

/**
 * 实时运行监控
 */
export default function RealTimeOperation() {
  const chartRef = useRef<BaseChartRef>(null);

  useEffect(() => {
    chartRef.current?.initOptions(options);
  }, []);

  useKeepTicking(() => {
    chartRef.current?.updateCharts({
      series: [{ data: buildSpeedData() }],
    });
  });

  return <BaseChart ref={chartRef} className="flex-1" />;
}

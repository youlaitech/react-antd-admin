import { useEffect, useRef } from "react";
import type { EChartsOption } from "echarts";

import BaseChart, { type BaseChartRef } from "./BaseChart";
import { useKeepTicking } from "../hooks/useKeepTicking";
import getSeriesData from "../seriesData";
import chinaGeoJSON from "../assets/chinaGeoJSON.json";

const initialData = getSeriesData(20);

const option: EChartsOption = {
  legend: { show: false },
  geo: [
    {
      map: "china",
      // zoom: 1.2, // 缩放比例
      aspectScale: 0.85,
      layoutCenter: ["50%", "50%"], //地图位置
      layoutSize: "100%",
      label: {
        show: true,
        color: "#fff",
        fontSize: 14,
      },
      emphasis: {
        itemStyle: {
          areaColor: "#409eff",
        },
        label: {
          color: "#fff",
        },
      },
      itemStyle: {
        areaColor: "rgba(7,21,55,0.8)",
        borderColor: "#0177ff",
        borderWidth: 2,
        shadowColor: "rgba(7,21,55,0.8)",
        shadowBlur: 10,
      },
      roam: true,
    },
  ],
  series: [
    {
      name: "地点",
      type: "effectScatter",
      coordinateSystem: "geo",
      rippleEffect: { brushType: "stroke" },
      emphasis: {
        label: {
          show: true,
          position: "right",
          formatter: "{b}",
        },
      },
      showEffectOn: "render",
      data: initialData.cityData,
    },
    {
      name: "线路",
      type: "lines",
      coordinateSystem: "geo",
      effect: {
        show: true,
        symbol: "arrow",
        symbolSize: 5,
        trailLength: 0,
      },
      lineStyle: {
        color: "#58B3CC",
        curveness: 0.08,
      },
      data: initialData.moveLines,
    },
  ],
};

/**
 * 漂浮地图：中国地图涟漪散点与飞线
 */
export default function MapChart() {
  const chartRef = useRef<BaseChartRef>(null);

  useEffect(() => {
    chartRef.current?.echarts.registerMap("china", chinaGeoJSON as never);
    chartRef.current?.initOptions(option);
  }, []);

  // 定时更新地图图表
  useKeepTicking(() => {
    const seriesData = getSeriesData(20);

    chartRef.current?.updateCharts({
      series: [{ data: seriesData.cityData }, { data: seriesData.moveLines }],
    });
  }, 6 * 1000);

  return (
    <div className="absolute inset-0 z-1">
      <BaseChart ref={chartRef} border={false} />
    </div>
  );
}

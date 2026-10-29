import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from "react";
import * as echarts from "echarts/core";
import {
  BarChart,
  EffectScatterChart,
  LineChart,
  LinesChart,
  PieChart,
  RadarChart,
  ScatterChart,
} from "echarts/charts";
import {
  GeoComponent, // 地理坐标系组件
  GridComponent, // 直角坐标系网格
  LegendComponent, // 图例组件
  TitleComponent, // 标题组件
  TooltipComponent, // 提示框组件
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsOption, EChartsType } from "echarts";

/** 注册必需组件（按需增减） */
echarts.use([
  CanvasRenderer,

  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,

  BarChart,
  PieChart,
  LineChart,
  LinesChart,
  RadarChart,
  ScatterChart,
  GeoComponent,
  EffectScatterChart,
]);

/** 图表组件暴露的操作 */
export interface BaseChartRef {
  /** echarts 核心模块，供注册地图等扩展 */
  echarts: typeof echarts;
  /**
   * 初始化配置（清空后设置）
   */
  initOptions: (options: EChartsOption) => void;
  /**
   * 更新图表配置（增量更新）
   */
  updateCharts: (options: EChartsOption) => void;
}

interface BaseChartProps {
  theme?: string;
  /** 是否渲染装饰边框与背景 */
  border?: boolean;
  /** 边框装饰颜色 */
  ornamentalColor?: string;
  /** 渲染在图表前的自定义内容 */
  before?: ReactNode;
  /** 渲染在图表后的自定义内容 */
  after?: ReactNode;
  /** 图表初始化完成回调 */
  onLoad?: (chart: EChartsType) => void;
  /** 追加到容器根节点的样式类 */
  className?: string;
}

/**
 * 大屏图表容器：按需注册 echarts 模块，持有实例并向外暴露初始化与更新方法
 */
const BaseChart = forwardRef<BaseChartRef, BaseChartProps>(function BaseChart(
  { theme = "light", border = true, ornamentalColor = "#7ce7fd", before, after, onLoad, className },
  ref
) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<EChartsType | null>(null);

  const init = () => {
    if (!chartRef.current) return;

    chartInstance.current =
      echarts.getInstanceByDom(chartRef.current) ??
      echarts.init(chartRef.current, theme, {
        renderer: "canvas", // 指定渲染模式（canvas性能更好）
      });
  };

  const initOptions = (options: EChartsOption) => {
    if (!chartInstance.current) init();

    chartInstance.current?.clear(); // 清空旧配置
    chartInstance.current?.setOption(options); // 应用新配置

    if (chartInstance.current) onLoad?.(chartInstance.current);
  };

  const updateCharts = (options: EChartsOption) => {
    if (!chartInstance.current) init();

    chartInstance.current?.setOption(options);
  };

  useEffect(() => {
    init();

    // 容器尺寸可能晚于图表初始化才确定，尺寸变化时同步给图表实例
    const el = chartRef.current;
    const observer = el ? new ResizeObserver(() => chartInstance.current?.resize()) : null;
    if (el && observer) observer.observe(el);

    return () => {
      observer?.disconnect();
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({ echarts, initOptions, updateCharts }));

  if (!border) {
    return <div ref={chartRef} className={`wh-full ${className ?? ""}`} />;
  }

  return (
    <div
      className={`border border-[#2E6099] charts-bg relative z-90 wh-full flex flex-col rounded-[4px] px-2 py-3 ${className ?? ""}`}
    >
      {/* 边框装饰 */}
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="ornamental" style={{ borderColor: ornamentalColor }} />
      ))}
      {before}
      <div ref={chartRef} className="wh-full" />
      {after}
    </div>
  );
});

export default BaseChart;

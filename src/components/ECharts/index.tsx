import type { EChartsOption } from "echarts";

import { useECharts } from "@/hooks/useECharts";

interface EChartsProps {
  /**
   * 图表配置
   * 必须用 useMemo 包一层，否则每次渲染都会重新 setOption
   */
  option: EChartsOption;
  /** 图表高度，缺省 300 */
  height?: number | string;
  /** 外层类名 */
  className?: string;
}

/** ECharts 图表 */
export default function ECharts({ option, height = 300, className }: EChartsProps) {
  const containerRef = useECharts(option);

  return (
    <div
      ref={containerRef}
      className={`echarts${className ? ` ${className}` : ""}`}
      style={{ height }}
    />
  );
}

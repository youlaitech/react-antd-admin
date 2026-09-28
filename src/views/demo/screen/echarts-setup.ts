import {
  BarChart,
  EffectScatterChart,
  LineChart,
  LinesChart,
  MapChart,
  PieChart,
} from "echarts/charts";
import {
  GeoComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";

/** 大屏专用图表注册 */
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  MapChart,
  EffectScatterChart,
  LinesChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  GeoComponent,
  CanvasRenderer,
]);

export default echarts;

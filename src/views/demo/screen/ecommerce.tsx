import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
} from "react";
import {
  BellOutlined,
  EnvironmentOutlined,
  FileExclamationOutlined,
  LineChartOutlined,
  MoneyCollectOutlined,
  PieChartOutlined,
  ProfileOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import type { EChartsOption } from "echarts";

import ECharts from "@/components/ECharts";
import { useFullscreen } from "@/hooks/useFullscreen";
import ScreenHeader from "./components/ScreenHeader";
import echarts from "./echarts-setup";
import {
  formatNumber,
  hexToRgba,
  registerChinaMap,
  SCREEN_COLORS,
  tweenValue,
  verticalGradient,
} from "./utils";

// 大屏主题：主标题用行业通用叫法，副标题为英文对照
const SCREEN_TITLE = "电商销售数据大屏";
const SCREEN_SUBTITLE = "E-COMMERCE SALES DASHBOARD";

interface MetricItem {
  label: string;
  /** 目标值，首屏由 0 滚动到位 */
  target: number;
  unit: string;
  trend: number;
  up: boolean;
  icon: ComponentType;
  color: string;
}

// 顶部核心指标：同一行内保证图标形状可区分，配色统一取冷色系，仅告警类用红
const METRICS: MetricItem[] = [
  {
    label: "今日销售额",
    target: 128460,
    unit: "元",
    trend: 12.5,
    up: true,
    icon: MoneyCollectOutlined,
    color: "#3ba9ff",
  },
  {
    label: "订单量",
    target: 3842,
    unit: "单",
    trend: 8.3,
    up: true,
    icon: ProfileOutlined,
    color: "#38bdf8",
  },
  {
    label: "新增用户",
    target: 1286,
    unit: "人",
    trend: 15.2,
    up: true,
    icon: UserAddOutlined,
    color: "#818cf8",
  },
  {
    label: "活跃用户",
    target: 26480,
    unit: "人",
    trend: 3.7,
    up: true,
    icon: TeamOutlined,
    color: "#a78bfa",
  },
  {
    label: "加购件数",
    target: 8642,
    unit: "件",
    trend: 6.1,
    up: true,
    icon: ShoppingCartOutlined,
    color: "#22d3ee",
  },
  {
    label: "退款订单",
    target: 42,
    unit: "单",
    trend: 4.8,
    up: false,
    icon: FileExclamationOutlined,
    color: "#f87171",
  },
];

// 各省销售额（万元），名称需与 GeoJSON 中的 properties.name 完全一致
const PROVINCE_SALES: Record<string, number> = {
  北京市: 9860,
  天津市: 4620,
  河北省: 6840,
  山西省: 3260,
  内蒙古自治区: 2480,
  辽宁省: 5120,
  吉林省: 2860,
  黑龙江省: 3120,
  上海市: 11240,
  江苏省: 12480,
  浙江省: 11860,
  安徽省: 6240,
  福建省: 7820,
  江西省: 4120,
  山东省: 10420,
  河南省: 8640,
  湖北省: 7260,
  湖南省: 6840,
  广东省: 15860,
  广西壮族自治区: 3860,
  海南省: 2140,
  重庆市: 5420,
  四川省: 9260,
  贵州省: 3280,
  云南省: 3620,
  西藏自治区: 620,
  陕西省: 4820,
  甘肃省: 2260,
  青海省: 780,
  宁夏回族自治区: 860,
  新疆维吾尔自治区: 2460,
  台湾省: 1860,
  香港特别行政区: 3240,
  澳门特别行政区: 980,
};

// 日内维度：近 24 小时订单量
const HOURLY_LABELS = Array.from(
  { length: 24 },
  (_, hour) => `${String(hour).padStart(2, "0")}:00`
);

const HOURLY_ORDERS = [
  220, 160, 120, 96, 88, 120, 320, 860, 1580, 2260, 2680, 2940, 2180, 2460, 2860, 3120, 3280, 2980,
  3420, 3860, 4120, 3620, 2480, 1260,
];

// 品类销售 TOP 5
const CATEGORY_SALES = [
  { name: "手机数码", value: 4860 },
  { name: "家用电器", value: 3920 },
  { name: "服饰鞋包", value: 3480 },
  { name: "美妆护肤", value: 2860 },
  { name: "食品生鲜", value: 2140 },
];

// 支付方式占比
const PAYMENT_SHARE = [
  { value: 48200, name: "微信支付" },
  { value: 32600, name: "支付宝" },
  { value: 12400, name: "银行卡" },
  { value: 6800, name: "其它" },
];

// 实时动态消息池
const LOG_TEMPLATES = [
  "用户 138****2846 下单成功，金额 ￥1,286",
  "商品「无线降噪耳机」库存低于预警值",
  "订单 20260919001284 已完成支付",
  "用户 159****6620 申请退款 ￥328",
  "促销活动「秋季大促」已上线",
  "接口 /api/order/create 响应耗时 1.2s",
  "新用户 186****0384 完成注册",
  "商品「智能手表」加入秒杀活动",
];

const {
  axis: AXIS_COLOR,
  grid: GRID_COLOR,
  accent: ACCENT_COLOR,
  success: SUCCESS_COLOR,
  pie: PIE_COLORS,
} = SCREEN_COLORS;

// 与组件状态无关的静态配置放在模块作用域，避免每次渲染新建对象导致图表反复 setOption
const HOURLY_OPTIONS: EChartsOption = {
  tooltip: { trigger: "axis" },
  grid: { left: 52, right: 20, top: 20, bottom: 28 },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: HOURLY_LABELS,
    axisLine: { lineStyle: { color: AXIS_COLOR } },
    axisLabel: { color: AXIS_COLOR, interval: 3 },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",
    name: "单",
    nameTextStyle: { color: AXIS_COLOR },
    splitLine: { lineStyle: { color: GRID_COLOR } },
    axisLabel: { color: AXIS_COLOR },
  },
  series: [
    {
      name: "订单量",
      type: "line",
      smooth: true,
      showSymbol: false,
      data: HOURLY_ORDERS,
      itemStyle: { color: ACCENT_COLOR },
      lineStyle: { width: 2, color: ACCENT_COLOR, shadowColor: ACCENT_COLOR, shadowBlur: 8 },
      areaStyle: { color: verticalGradient("rgba(59, 169, 255, 0.45)", "rgba(59, 169, 255, 0)") },
    },
  ],
};

const CATEGORY_OPTIONS: EChartsOption = {
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  grid: { left: 72, right: 40, top: 12, bottom: 12 },
  xAxis: {
    type: "value",
    splitLine: { lineStyle: { color: GRID_COLOR } },
    axisLabel: { color: AXIS_COLOR },
  },
  yAxis: {
    type: "category",
    // 反转后最大值显示在顶部
    data: CATEGORY_SALES.map((item) => item.name).reverse(),
    axisLine: { lineStyle: { color: AXIS_COLOR } },
    axisLabel: { color: AXIS_COLOR, fontSize: 11 },
    axisTick: { show: false },
  },
  series: [
    {
      name: "销量",
      type: "bar",
      barWidth: 10,
      data: CATEGORY_SALES.map((item) => item.value).reverse(),
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: verticalGradient("rgba(56, 189, 248, 0.85)", "rgba(56, 189, 248, 0.22)"),
      },
      label: { show: true, position: "right", color: AXIS_COLOR, fontSize: 11 },
    },
  ],
};

const PAYMENT_OPTIONS: EChartsOption = {
  tooltip: { trigger: "item" },
  legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: AXIS_COLOR } },
  series: [
    {
      name: "支付方式",
      type: "pie",
      radius: ["46%", "68%"],
      center: ["50%", "44%"],
      label: { color: AXIS_COLOR, fontSize: 11 },
      labelLine: { lineStyle: { color: AXIS_COLOR } },
      data: PAYMENT_SHARE.map((item, index) => ({
        ...item,
        itemStyle: { color: PIE_COLORS[index] },
      })),
    },
  ],
};

interface MetricState extends MetricItem {
  value: number;
}

interface LogItem {
  id: number;
  time: string;
  text: string;
}

/** 指标卡，左右两栏共用 */
function MetricCard({ item }: { item: MetricState }) {
  const Icon = item.icon;

  return (
    <div
      className="screen__metric flex min-h-0 flex-1 items-center gap-3 p-3"
      style={{ "--metric-color": item.color } as CSSProperties}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
        style={{
          color: item.color,
          backgroundColor: hexToRgba(item.color, 0.14),
          border: `1px solid ${hexToRgba(item.color, 0.35)}`,
        }}
      >
        <Icon />
      </div>
      <div className="min-w-0">
        <div className="truncate text-13px text-[var(--screen-text-2)]">{item.label}</div>
        <div className="flex items-baseline gap-1">
          <span className="screen__metric-value text-26px font-700">
            {formatNumber(item.value)}
          </span>
          <span className="text-12px text-[var(--screen-text-2)]">{item.unit}</span>
        </div>
      </div>
      <span
        className="ml-auto shrink-0 text-12px"
        style={{ color: item.up ? "var(--screen-success)" : "var(--screen-danger)" }}
      >
        {item.up ? "↑" : "↓"}
        {item.trend}%
      </span>
    </div>
  );
}

/** 电商销售数据大屏 */
export default function ScreenEcommerce() {
  const screenRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(screenRef);

  const [metrics, setMetrics] = useState<MetricState[]>(() =>
    METRICS.map((item) => ({ ...item, value: 0 }))
  );
  const [logs, setLogs] = useState<LogItem[]>([
    { id: 5, time: "15:50:12", text: "用户 138****2846 下单成功，金额 ￥1,286" },
    { id: 4, time: "15:49:38", text: "商品「无线降噪耳机」库存低于预警值" },
    { id: 3, time: "15:48:05", text: "订单 20260919001284 已完成支付" },
    { id: 2, time: "15:46:52", text: "促销活动「秋季大促」已上线" },
    { id: 1, time: "15:45:20", text: "新用户 186****0384 完成注册" },
  ]);

  // 中国地图数据体积较大，放在 public 下运行时加载，避免打进主包
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading");
  // 省份中心点坐标，加载地图后填充，用于绘制散点与飞线
  const [provinceCenters, setProvinceCenters] = useState<Record<string, [number, number]>>({});

  /** 动画起点要读当前值，用 ref 承接避免把 metrics 拖进回调依赖 */
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  /** 指标值平滑过渡到目标值 */
  const tweenMetrics = useCallback((targets: number[], duration: number) => {
    metricsRef.current.forEach((item, index) => {
      tweenValue(
        item.value,
        targets[index],
        (value) => {
          setMetrics((current) => current.map((row, i) => (i === index ? { ...row, value } : row)));
        },
        duration
      );
    });
  }, []);

  /** 追加一条实时日志 */
  const pushLog = useCallback(() => {
    setLogs((current) => {
      const nextId = (current[0]?.id ?? 0) + 1;
      return [
        {
          id: nextId,
          time: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
          text: LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)],
        },
        ...current,
      ].slice(0, 6);
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      tweenMetrics(
        metricsRef.current.map((item) => item.value + Math.round(Math.random() * 60)),
        900
      );
      pushLog();
    }, 3000);

    return () => window.clearInterval(timer);
  }, [pushLog, tweenMetrics]);

  useEffect(() => {
    tweenMetrics(
      METRICS.map((item) => item.target),
      1200
    );

    registerChinaMap(echarts)
      .then(setProvinceCenters)
      .then(() => setMapStatus("ready"))
      .catch(() => {
        // 地图失败不影响其它图表，面板内显示占位文案
        setMapStatus("error");
      });
  }, [tweenMetrics]);

  // 驾驶舱布局把指标卡分列地图左右两侧
  const leftMetrics = metrics.slice(0, 3);
  const rightMetrics = metrics.slice(3);

  const mapOptions = useMemo<EChartsOption>(() => {
    // 销售额前 8 的省份，作为地图上的涟漪散点
    const scatterData = Object.entries(PROVINCE_SALES)
      .filter(([name]) => provinceCenters[name])
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value: [...provinceCenters[name], value] }));

    // 销售额前 12 的省份汇聚到总部北京的飞线
    const beijing = provinceCenters["北京市"];
    const flyLines = beijing
      ? Object.entries(PROVINCE_SALES)
          .filter(([name]) => name !== "北京市" && provinceCenters[name])
          .sort(([, a], [, b]) => b - a)
          .slice(0, 12)
          .map(([name]) => ({ coords: [provinceCenters[name], beijing] }))
      : [];

    return {
      tooltip: {
        trigger: "item",
        // echarts 的 formatter 入参类型过宽，这里按实际用到的字段收窄
        formatter: (params) => {
          const { name, value } = params as { name: string; value?: unknown };
          const raw = Array.isArray(value) ? value[2] : value;
          const amount = typeof raw === "number" ? raw : 0;
          return `${name}<br/>销售额：${formatNumber(amount)} 万元`;
        },
      },
      // geo 只提供投影坐标系，地图着色交给 map 系列，避免与散点、飞线错位
      geo: {
        map: "china",
        roam: false,
        silent: true,
        itemStyle: { areaColor: "transparent", borderColor: "transparent" },
      },
      visualMap: {
        min: 0,
        max: 16000,
        left: 8,
        bottom: 8,
        text: ["高", "低"],
        textStyle: { color: AXIS_COLOR },
        inRange: { color: ["#0f3355", "#1c5486", "#2b7fc4", ACCENT_COLOR] },
        calculable: true,
      },
      series: [
        {
          name: "销售额",
          type: "map",
          map: "china",
          roam: false,
          label: { show: false },
          itemStyle: {
            areaColor: "#0f3355",
            borderColor: "#3d86c6",
            borderWidth: 0.8,
            shadowColor: "rgba(59, 169, 255, 0.55)",
            shadowBlur: 18,
          },
          emphasis: {
            label: { show: true, color: "#ffffff", fontSize: 11 },
            itemStyle: { areaColor: ACCENT_COLOR },
          },
          select: { disabled: true },
          data: Object.entries(PROVINCE_SALES).map(([name, value]) => ({ name, value })),
        },
        {
          name: "重点省份",
          type: "effectScatter",
          coordinateSystem: "geo",
          data: scatterData,
          symbolSize: (value: number[]) => Math.max(6, Math.round(value[2] / 1400)),
          rippleEffect: { brushType: "stroke", scale: 3.5 },
          itemStyle: { color: SUCCESS_COLOR, shadowBlur: 12, shadowColor: SUCCESS_COLOR },
        },
        {
          name: "订单流向",
          type: "lines",
          coordinateSystem: "geo",
          data: flyLines,
          effect: {
            show: true,
            period: 4,
            trailLength: 0.55,
            symbol: "arrow",
            symbolSize: 5,
            color: "#7dd3fc",
          },
          lineStyle: { color: ACCENT_COLOR, width: 1, opacity: 0.3, curveness: 0.25 },
        },
      ],
    };
  }, [provinceCenters]);

  return (
    <div className="page-container">
      <div ref={screenRef} className="screen flex min-h-0 flex-1 flex-col gap-3 p-4">
        <ScreenHeader
          title={SCREEN_TITLE}
          subtitle={SCREEN_SUBTITLE}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />

        <div className="grid min-h-0 flex-1 grid-cols-12 grid-rows-3 gap-3">
          <div className="col-span-3 col-start-1 row-span-2 row-start-1 flex min-h-0 flex-col gap-3">
            {leftMetrics.map((item) => (
              <MetricCard key={item.label} item={item} />
            ))}
          </div>

          <section className="screen__panel screen__panel--map col-span-6 col-start-4 row-span-2 row-start-1 flex min-h-0 flex-col">
            <h2 className="screen__panel-title">
              <EnvironmentOutlined />
              <span>全国销售额实时分布</span>
            </h2>
            <div className="min-h-0 flex-1">
              {mapStatus === "ready" ? (
                <ECharts option={mapOptions} height="100%" />
              ) : (
                <div className="flex h-full items-center justify-center text-13px text-[var(--screen-text-2)]">
                  {mapStatus === "loading" ? "地图数据加载中…" : "地图数据加载失败"}
                </div>
              )}
            </div>
          </section>

          <div className="col-span-3 col-start-10 row-span-2 row-start-1 flex min-h-0 flex-col gap-3">
            {rightMetrics.map((item) => (
              <MetricCard key={item.label} item={item} />
            ))}
          </div>

          <section className="screen__panel col-span-4 col-start-1 row-start-3 flex min-h-0 flex-col">
            <h2 className="screen__panel-title">
              <LineChartOutlined />
              <span>24 小时订单趋势</span>
            </h2>
            <div className="min-h-0 flex-1">
              <ECharts option={HOURLY_OPTIONS} height="100%" />
            </div>
          </section>

          <section className="screen__panel col-span-4 col-start-5 row-start-3 flex min-h-0 flex-col">
            <h2 className="screen__panel-title">
              <TrophyOutlined />
              <span>品类销售 TOP 5</span>
            </h2>
            <div className="min-h-0 flex-1">
              <ECharts option={CATEGORY_OPTIONS} height="100%" />
            </div>
          </section>

          <section className="screen__panel col-span-4 col-start-9 row-start-3 flex min-h-0 flex-col">
            <h2 className="screen__panel-title">
              <PieChartOutlined />
              <span>支付方式占比</span>
            </h2>
            <div className="min-h-0 flex-1">
              <ECharts option={PAYMENT_OPTIONS} height="100%" />
            </div>
          </section>
        </div>

        <div className="screen__panel flex shrink-0 items-center gap-4 px-3 py-2">
          <span className="flex shrink-0 items-center gap-1 text-12px font-600 text-[var(--screen-accent)]">
            <BellOutlined />
            实时订单动态
          </span>
          {logs.slice(0, 3).map((item) => (
            <div key={item.id} className="flex min-w-0 flex-1 items-center gap-2">
              <span className="shrink-0 text-12px text-[var(--screen-text-2)]">{item.time}</span>
              <span className="truncate text-12px text-[var(--screen-text-1)]">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

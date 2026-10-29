import { useEffect, useMemo, useState } from "react";
import { Segmented } from "antd";
import dayjs from "dayjs";
import type { EChartsOption } from "echarts";
import { useTranslation } from "react-i18next";

import LogAPI from "@/api/system/log";
import type { VisitTrendDetail } from "@/api/system/log";
import { useECharts } from "@/hooks/useECharts";
import { useThemeDark } from "@/hooks/useThemeDark";
import { useAppStore } from "@/stores/app";

const EMPTY_TREND: VisitTrendDetail = { dates: [], pvList: [], uvList: [] };

/**
 * 访问趋势
 */
export default function VisitTrendChart() {
  const { t } = useTranslation();
  const isDark = useThemeDark();
  const colorPrimary = useAppStore((state) => state.themeColors.primary);
  const successColor = useAppStore((state) => state.themeColors.success);

  const [days, setDays] = useState(7);
  const [trend, setTrend] = useState<VisitTrendDetail>(EMPTY_TREND);

  useEffect(() => {
    const endDate = dayjs();
    const startDate = endDate.subtract(days - 1, "day");

    LogAPI.getVisitTrend({
      startDate: startDate.format("YYYY-MM-DD"),
      endDate: endDate.format("YYYY-MM-DD"),
    })
      .then(setTrend)
      .catch((error) => console.warn(error));
  }, [days]);

  const option = useMemo<EChartsOption>(() => {
    const textSecondary = isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.45)";
    const splitLineColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)";

    return {
      tooltip: { trigger: "axis", borderWidth: 0, padding: [8, 12] },
      legend: {
        data: [t("dashboard.pv"), t("dashboard.uv")],
        bottom: 0,
        textStyle: { fontSize: 12, color: textSecondary },
        itemWidth: 10,
        itemHeight: 8,
        itemGap: 24,
      },
      grid: { left: "0%", right: "3%", bottom: "14%", top: "5%", containLabel: true },
      xAxis: {
        type: "category",
        data: trend.dates,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: splitLineColor } },
        axisLabel: { fontSize: 11, color: textSecondary },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { type: "dashed", color: splitLineColor, width: 1 } },
        axisLabel: { fontSize: 11, color: textSecondary },
      },
      series: [
        {
          name: t("dashboard.pv"),
          type: "line",
          data: trend.pvList,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: colorPrimary, width: 2.2 },
          itemStyle: { color: colorPrimary },
          areaStyle: { color: colorPrimary, opacity: 0.12 },
        },
        {
          name: t("dashboard.uv"),
          type: "line",
          data: trend.uvList,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: successColor, width: 1.8, opacity: 0.86 },
          itemStyle: { color: successColor },
          areaStyle: { color: successColor, opacity: 0.08 },
        },
      ],
    };
  }, [trend, isDark, colorPrimary, successColor, t]);

  const containerRef = useECharts(option);

  return (
    <div className="dash-card dash-card--trend">
      <div className="dash-card__head">
        <h3 className="dash-card__title">{t("dashboard.visitTrend")}</h3>
        <Segmented
          size="small"
          value={days}
          options={[
            { label: t("dashboard.last7Days"), value: 7 },
            { label: t("dashboard.last30Days"), value: 30 },
          ]}
          onChange={(value) => setDays(value as number)}
        />
      </div>

      <div className="dash-card__body dash-card__body--chart">
        <div ref={containerRef} className="dash-chart-canvas" />
      </div>
    </div>
  );
}

import { defineMock } from "./base";

export default defineMock([
  {
    url: "analytics/visits/summary",
    method: ["GET"],
    body: {
      code: "00000",
      data: {
        todayUv: 169,
        yesterdayUv: 176,
        totalUv: 19985,
        todayPv: 1629,
        yesterdayPv: 1712,
        totalPv: 286086,
        uvGrowthRate: -0.0398,
        pvGrowthRate: -0.0485,
      },
      msg: "一切ok",
    },
  },
  {
    url: "analytics/visits/trend",
    method: ["GET"],
    body({ query }) {
      // 以查询截止日为终点往前生成 30 天，保证任意时间段的裁剪都能命中
      const start = String(query?.startDate ?? "");
      const end = String(query?.endDate ?? "");
      const endDate = end ? new Date(`${end}T00:00:00`) : new Date();
      const dates = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(endDate);
        d.setDate(endDate.getDate() - (29 - i));
        const y = d.getFullYear();
        const m = `${d.getMonth() + 1}`.padStart(2, "0");
        const day = `${d.getDate()}`.padStart(2, "0");
        return `${y}-${m}-${day}`;
      });
      // 用确定公式生成波动数据，避免每次刷新数字跳变
      const pvList = dates.map(
        (_, i) => 900 + Math.round(500 * Math.sin(i * 0.6)) + ((i * 211) % 800),
      );
      const uvList = dates.map(
        (_, i) => 90 + Math.round(60 * Math.sin(i * 0.7)) + ((i * 67) % 90),
      );
      const keep = dates
        .map((date, index) => ({ date, index }))
        .filter((item) => (!start || item.date >= start) && (!end || item.date <= end));

      return {
        code: "00000",
        data: {
          startDate: keep.length ? keep[0].date : start,
          endDate: keep.length ? keep[keep.length - 1].date : end,
          points: keep.map((item) => ({
            date: item.date,
            pv: pvList[item.index],
            uv: uvList[item.index],
          })),
        },
        msg: "一切ok",
      };
    },
  },
  {
    url: "analytics/users/summary",
    method: ["GET"],
    body: {
      code: "00000",
      data: { total: 128 },
      msg: "一切ok",
    },
  },
]);

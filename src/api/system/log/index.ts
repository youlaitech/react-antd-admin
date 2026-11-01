import request from "@/utils/request";
import type { PageResult } from "@/api/common";
import type {
  LogItem,
  LogQueryParams,
  VisitOverviewDetail,
  VisitTrendDetail,
  VisitTrendQueryParams,
} from "./types";

const LOG_BASE_URL = "/api/v1/logs";

const LogAPI = {
  /**
   * 获取操作日志分页列表
   */
  getPage(queryParams: LogQueryParams) {
    return request<PageResult<LogItem>>({
      url: `${LOG_BASE_URL}`,
      method: "get",
      params: queryParams,
    });
  },

  /**
   * 获取访问趋势统计
   */
  getVisitTrend(queryParams: VisitTrendQueryParams) {
    return request<VisitTrendDetail>({
      url: `${LOG_BASE_URL}/analytics/trend`,
      method: "get",
      params: queryParams,
    });
  },

  /**
   * 获取访问概览统计
   */
  getVisitOverview() {
    return request<VisitOverviewDetail>({
      url: `${LOG_BASE_URL}/analytics/overview`,
      method: "get",
    });
  },
};

export default LogAPI;

// 重导出类型
export * from "./types";

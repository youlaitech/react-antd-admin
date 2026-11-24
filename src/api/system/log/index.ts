import request from "@/utils/request";
import type { PageResult } from "@/api/common";
import type { LogItem, LogQueryParams } from "./types";

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
};

export default LogAPI;

// 重导出类型
export * from "./types";

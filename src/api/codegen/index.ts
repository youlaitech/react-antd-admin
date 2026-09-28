import request from "@/utils/request";
import { downloadFile } from "@/utils/download";
import type { PageResult } from "@/api/common";
import type { GenConfigForm, GeneratorPreviewItem, TableItem, TableQueryParams } from "./types";

const GENERATOR_BASE_URL = "/api/v1/codegen";

/** 二进制响应：文件内容与响应头 */
type BlobResponse = { data: BlobPart; headers: Record<string, unknown> };

/** 页面类型与前端语言，预览与下载共用 */
interface CodegenOptions {
  pageType?: "classic" | "crud";
  type?: "ts" | "js";
}

/**
 * 构建预览与下载接口的查询参数
 */
function buildCodegenParams({ pageType, type }: CodegenOptions = {}) {
  const params: Record<string, string> = {};
  if (pageType) params.pageType = pageType;
  if (type) params.type = type;
  return Object.keys(params).length ? params : undefined;
}

const GeneratorAPI = {
  /**
   * 获取数据表分页列表
   */
  getTablePage(params: TableQueryParams) {
    return request<PageResult<TableItem>>({
      url: `${GENERATOR_BASE_URL}/table`,
      method: "get",
      params,
    });
  },

  /**
   * 获取代码生成配置
   */
  getGenConfig(tableName: string) {
    return request<GenConfigForm>({
      url: `${GENERATOR_BASE_URL}/${tableName}/config`,
      method: "get",
    });
  },

  /**
   * AI 推断代码生成配置，未开启 AI 时返回业务异常
   */
  aiFillConfig(tableName: string, requirement?: string) {
    return request<GenConfigForm>({
      url: `${GENERATOR_BASE_URL}/${tableName}/ai-config`,
      method: "post",
      data: requirement ? { requirement } : undefined,
    });
  },

  /**
   * 保存代码生成配置
   */
  saveGenConfig(tableName: string, data: GenConfigForm) {
    return request({
      url: `${GENERATOR_BASE_URL}/${tableName}/config`,
      method: "post",
      data,
    });
  },

  /**
   * 获取代码生成预览数据
   */
  getPreviewData(tableName: string, options?: CodegenOptions) {
    return request<GeneratorPreviewItem[]>({
      url: `${GENERATOR_BASE_URL}/${tableName}/preview`,
      method: "get",
      params: buildCodegenParams(options),
    });
  },

  /**
   * 重置代码生成配置
   */
  resetGenConfig(tableName: string) {
    return request({
      url: `${GENERATOR_BASE_URL}/${tableName}/config`,
      method: "delete",
    });
  },

  /** 下载代码生成 ZIP */
  async download(tableName: string, options?: CodegenOptions) {
    const response = await request<BlobResponse>({
      url: `${GENERATOR_BASE_URL}/${tableName}/download`,
      method: "get",
      params: buildCodegenParams(options),
      responseType: "blob",
    });

    const hasFileName = Boolean(response.headers?.["content-disposition"]);
    downloadFile(response, hasFileName ? undefined : `${tableName}.zip`);
  },
};

export default GeneratorAPI;

export * from "./types";

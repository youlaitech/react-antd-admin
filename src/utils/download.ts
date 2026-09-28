/**
 * 从响应头中提取文件名
 * @param contentDisposition Content-Disposition 响应头
 */
function extractFileName(contentDisposition: string): string {
  if (!contentDisposition) {
    return `download_${Date.now()}`;
  }

  // 优先取 RFC 5987 的 filename*=UTF-8''xxx，中文名只在这种写法里
  const filenameRegex = /filename\*=UTF-8''(.+)/;
  const matches = filenameRegex.exec(contentDisposition);
  if (matches?.[1]) {
    return decodeURIComponent(matches[1]);
  }

  const fallbackRegex = /filename=([^;]+)/;
  const fallbackMatches = fallbackRegex.exec(contentDisposition);
  if (fallbackMatches?.[1]) {
    return decodeURI(fallbackMatches[1].replace(/"/g, ""));
  }

  return `download_${Date.now()}`;
}

/**
 * 下载响应：二进制接口响应或自组装的二进制内容
 */
interface DownloadResponse {
  /** 二进制内容 */
  data: BlobPart;
  /** 响应头，用于解析文件名，自组装数据可省略 */
  headers?: Record<string, unknown>;
}

/**
 * 下载文件
 * @param response 二进制接口响应或 { data } 形式的二进制内容
 * @param customFileName 自定义文件名
 */
export function downloadFile(response: DownloadResponse, customFileName?: string): void {
  try {
    const contentDisposition = String(response.headers?.["content-disposition"] ?? "");
    const fileName = customFileName || extractFileName(contentDisposition);

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("文件下载失败:", error);
    throw error;
  }
}

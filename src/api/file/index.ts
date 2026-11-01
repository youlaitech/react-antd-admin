import request from "@/utils/request";
import { downloadFile } from "@/utils/download";
import type { FileInfo } from "./types";

const FILE_BASE_URL = "/api/v1/files";

const FileAPI = {
  /**
   * 上传文件
   * @param formData 表单数据
   * @param onProgress 上传进度回调，参数为百分比
   */
  upload(formData: FormData, onProgress?: (percent: number) => void) {
    return request<FileInfo>({
      url: FILE_BASE_URL,
      method: "post",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (!progressEvent.total) return;
        onProgress?.(Math.round((progressEvent.loaded * 100) / progressEvent.total));
      },
    });
  },

  /**
   * 上传文件
   * @param file 待上传的文件
   */
  uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request<FileInfo>({
      url: FILE_BASE_URL,
      method: "post",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**
   * 删除文件
   */
  delete(filePath?: string) {
    return request({
      url: FILE_BASE_URL,
      method: "delete",
      params: { filePath },
    });
  },

  /**
   * 下载文件
   */
  download(url: string, fileName?: string) {
    return request<{ data: BlobPart; headers: Record<string, unknown> }>({
      url,
      method: "get",
      responseType: "blob",
    }).then((response) => downloadFile(response, fileName));
  },
};

export default FileAPI;

// 重导出类型
export * from "./types";

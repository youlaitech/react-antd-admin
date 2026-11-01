import { useEffect, useState } from "react";
import { App as AntdApp, Button, Upload, type UploadFile } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import FileAPI from "@/api/file";
import type { FileInfo } from "@/api/file";
import { isWithinSize, matchAccept } from "@/utils/upload";

interface FileUploadProps {
  /** 文件集合 */
  value?: FileInfo[];
  /** 文件集合变更回调 */
  onChange?: (value: FileInfo[]) => void;
  /** 允许的文件类型 */
  accept?: string;
  /** 数量上限 */
  limit?: number;
  /** 单个文件大小上限(MB) */
  maxFileSize?: number;
  /** 上传按钮文案 */
  uploadBtnText?: string;
  /** 外层类名 */
  className?: string;
}

/**
 * 文件上传
 */
export default function FileUpload({
  value = [],
  onChange,
  accept = "*",
  limit = 10,
  maxFileSize = 10,
  uploadBtnText,
  className,
}: FileUploadProps) {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();

  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // 外部值变化时同步上传列表
  useEffect(() => {
    setFileList(
      value.map((item) => ({
        uid: item.url,
        name: item.name || item.url.split("/").pop() || "file",
        status: "done",
        url: item.url,
      })),
    );
  }, [value]);

  /**
   * 上传前校验数量、类型与大小
   */
  function handleBeforeUpload(file: File) {
    if (value.length >= limit) {
      message.warning(t("common.uploadFileCountLimit", { count: limit }));
      return Upload.LIST_IGNORE;
    }
    if (!matchAccept(file, accept)) {
      message.warning(t("common.uploadTypeInvalid", { accept }));
      return Upload.LIST_IGNORE;
    }
    if (!isWithinSize(file, maxFileSize)) {
      message.warning(t("common.uploadFileSizeLimit", { size: maxFileSize }));
      return Upload.LIST_IGNORE;
    }

    uploadFile(file);
    // 自行上传，不走 antd 的默认行为
    return false;
  }

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const info = await FileAPI.upload(formData, (percent) => {
        // 上传期间用百分比占位，上传完成后由外部值替换掉
        setFileList((prev) => [
          ...prev.filter((item) => item.name !== file.name),
          { uid: file.name, name: file.name, percent, status: "uploading" },
        ]);
      });
      message.success(t("common.uploadSuccess"));
      onChange?.([...value, info]);
    } catch (error) {
      setFileList((prev) => prev.filter((item) => item.name !== file.name));
      message.error(
        `${t("common.uploadFailed")}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 删除文件：先删服务端文件，再更新集合
   */
  async function handleRemove(file: UploadFile) {
    const url = file.url ?? String(file.uid);
    await FileAPI.delete(url);
    onChange?.(value.filter((item) => item.url !== url));
    return true;
  }

  return (
    <Upload
      className={className}
      accept={accept}
      maxCount={limit}
      fileList={fileList}
      beforeUpload={handleBeforeUpload}
      onRemove={handleRemove}
      onDownload={(file) => file.url && FileAPI.download(file.url, file.name)}
    >
      <Button icon={<UploadOutlined />} disabled={value.length >= limit}>
        {uploadBtnText ?? t("common.uploadFile")}
      </Button>
    </Upload>
  );
}

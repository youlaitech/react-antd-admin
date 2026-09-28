import { useState } from "react";
import { App as AntdApp, Button, Image, Spin, Upload } from "antd";
import { CloseCircleFilled, PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import FileAPI from "@/api/file";
import { isWithinSize, matchAccept } from "@/utils/upload";

interface SingleImageUploadProps {
  /** 图片地址 */
  value?: string;
  /** 地址变更回调 */
  onChange?: (value: string) => void;
  /** 允许的图片类型 */
  accept?: string;
  /** 最大文件大小(MB) */
  maxFileSize?: number;
  /** 预览框尺寸，缺省 150x150 */
  size?: number;
}

/** 单图上传 */
export default function SingleImageUpload({
  value,
  onChange,
  accept = "image/*",
  maxFileSize = 10,
  size = 150,
}: SingleImageUploadProps) {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const [uploading, setUploading] = useState(false);

  /**
   * 上传前校验类型与大小
   */
  function handleBeforeUpload(file: File) {
    if (!matchAccept(file, accept)) {
      message.warning(t("common.uploadTypeInvalid", { accept }));
      return Upload.LIST_IGNORE;
    }
    if (!isWithinSize(file, maxFileSize)) {
      message.warning(t("common.uploadImageSizeLimit", { size: maxFileSize }));
      return Upload.LIST_IGNORE;
    }

    handleUpload(file);
    // 自行上传，不走 antd 的默认行为
    return false;
  }

  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const info = await FileAPI.upload(formData);
      message.success(t("common.uploadSuccess"));
      onChange?.(info.url);
    } catch (error) {
      message.error(
        `${t("common.uploadFailed")}: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="single-upload" style={{ width: size, height: size }}>
      {value ? (
        <>
          <Image className="single-upload__image" src={value} height={size} />
          <CloseCircleFilled
            className="single-upload__delete-btn"
            onClick={(event) => {
              event.stopPropagation();
              onChange?.("");
            }}
          />
        </>
      ) : (
        <Upload showUploadList={false} accept={accept} beforeUpload={handleBeforeUpload}>
          <Button type="dashed" className="single-upload__trigger" style={{ height: size }}>
            <Spin spinning={uploading} size="small">
              <PlusOutlined />
            </Spin>
          </Button>
        </Upload>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { App as AntdApp, Image, Upload, type UploadFile, type UploadProps } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import FileAPI from "@/api/file";
import { isWithinSize, matchAccept } from "@/utils/upload";

interface MultiImageUploadProps {
  /** 图片地址集合 */
  value?: string[];
  /** 地址集合变更回调 */
  onChange?: (value: string[]) => void;
  /** 允许的图片类型 */
  accept?: string;
  /** 数量上限 */
  limit?: number;
  /** 单个文件大小上限(MB) */
  maxFileSize?: number;
}

/**
 * 多图上传
 */
export default function MultiImageUpload({
  value = [],
  onChange,
  accept = "image/*",
  limit = 10,
  maxFileSize = 10,
}: MultiImageUploadProps) {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState("");

  // 外部值变化时同步上传列表（编辑回显、表单重置都会走到这里）
  useEffect(() => {
    setFileList(
      value.map((url) => ({ uid: url, name: url.split("/").pop() ?? "image", status: "done", url }))
    );
  }, [value]);

  /**
   * 上传前校验数量、类型与大小
   */
  function handleBeforeUpload(file: File) {
    if (value.length >= limit) {
      message.warning(t("common.uploadImageCountLimit", { count: limit }));
      return Upload.LIST_IGNORE;
    }
    if (!matchAccept(file, accept)) {
      message.warning(t("common.uploadTypeInvalid", { accept }));
      return Upload.LIST_IGNORE;
    }
    if (!isWithinSize(file, maxFileSize)) {
      message.warning(t("common.uploadImageSizeLimit", { size: maxFileSize }));
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
      const info = await FileAPI.upload(formData);
      message.success(t("common.uploadSuccess"));
      onChange?.([...value, info.url]);
    } catch (error) {
      message.error(
        `${t("common.uploadFailed")}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 删除图片：先删服务端文件，再更新地址集合
   */
  async function handleRemove(file: UploadFile) {
    const url = file.url ?? String(file.uid);
    await FileAPI.delete(url);
    onChange?.(value.filter((item) => item !== url));
    return true;
  }

  const handlePreview: UploadProps["onPreview"] = (file) => {
    setPreviewUrl(file.url ?? "");
  };

  return (
    <>
      <Upload
        listType="picture-card"
        accept={accept}
        maxCount={limit}
        fileList={fileList}
        beforeUpload={handleBeforeUpload}
        onRemove={handleRemove}
        onPreview={handlePreview}
      >
        {value.length >= limit ? null : (
          <button type="button" className="multi-upload__trigger">
            <PlusOutlined />
            <div className="multi-upload__text">{t("common.upload")}</div>
          </button>
        )}
      </Upload>

      {previewUrl && (
        <Image
          style={{ display: "none" }}
          src={previewUrl}
          preview={{
            visible: true,
            src: previewUrl,
            onVisibleChange: (visible) => !visible && setPreviewUrl(""),
          }}
        />
      )}
    </>
  );
}

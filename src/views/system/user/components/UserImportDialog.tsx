import { useState } from "react";
import { Alert, App as AntdApp, Button, Modal, Table, Upload, type TableProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import UserAPI from "@/api/system/user";
import type { ExcelResult } from "@/api/common";
import { ApiCodeEnum } from "@/enums";
import { downloadFile } from "@/utils/download";

interface UserImportDialogProps {
  /** 弹窗是否打开 */
  open: boolean;
  /** 关闭弹窗 */
  onClose: () => void;
  /** 导入成功回调 */
  onSuccess: () => void;
}

/** 导入结果行 */
interface ImportResultRow {
  index: number;
  message: string;
}

/** 用户导入 */
export default function UserImportDialog({ open, onClose, onSuccess }: UserImportDialogProps) {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();

  const [file, setFile] = useState<File>();
  const [submitting, setSubmitting] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultData, setResultData] = useState<string[]>([]);
  const [resultCount, setResultCount] = useState({ invalidCount: 0, validCount: 0 });

  function resetState() {
    setFile(undefined);
    setResultData([]);
    setResultCount({ invalidCount: 0, validCount: 0 });
    setResultOpen(false);
  }

  function closeDialog() {
    resetState();
    onClose();
  }

  /** 下载导入模板 */
  function downloadTemplate() {
    UserAPI.downloadTemplate().then((response) => downloadFile(response));
  }

  async function handleUpload() {
    if (!file) {
      message.warning(t("system.user.importFileRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const result: ExcelResult = await UserAPI.import(file);

      if (result.code === ApiCodeEnum.SUCCESS && result.invalidCount === 0) {
        message.success(t("system.user.importSuccess", { count: result.validCount }));
        onSuccess();
        closeDialog();
        return;
      }

      message.error(t("system.user.importFailure"));
      setResultData(result.messageList ?? []);
      setResultCount({ invalidCount: result.invalidCount, validCount: result.validCount });
      setResultOpen(true);
    } finally {
      setSubmitting(false);
    }
  }

  const columns: TableProps<ImportResultRow>["columns"] = [
    { title: t("common.index"), dataIndex: "index", width: 100, align: "center" },
    { title: t("system.user.importErrorMessage"), dataIndex: "message" },
  ];

  return (
    <>
      <Modal
        title={t("system.user.importTitle")}
        width={600}
        centered
        open={open}
        confirmLoading={submitting}
        onOk={handleUpload}
        okButtonProps={{ disabled: !file }}
        onCancel={closeDialog}
        destroyOnHidden
      >
        <Upload.Dragger
          maxCount={1}
          accept=".xlsx,.xls"
          beforeUpload={(selected) => {
            setFile(selected);
            // 交给「确定」按钮统一上传
            return false;
          }}
          onRemove={() => setFile(undefined)}
          fileList={file ? [{ uid: "-1", name: file.name }] : []}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">{t("system.user.uploadTip")}</p>
          <p className="ant-upload-hint">{t("system.user.uploadHint")}</p>
        </Upload.Dragger>

        <div className="mt-2 text-xs text-secondary">
          {t("system.user.uploadLimit")}
          <Button type="link" size="small" onClick={downloadTemplate}>
            {t("system.user.downloadTemplate")}
          </Button>
        </div>
      </Modal>

      <Modal
        title={t("system.user.importResult")}
        width={600}
        open={resultOpen}
        footer={<Button onClick={() => setResultOpen(false)}>{t("common.close")}</Button>}
        onCancel={() => setResultOpen(false)}
      >
        <Alert
          type="warning"
          showIcon
          className="mb-3"
          message={t("system.user.importResultSummary", {
            invalid: resultCount.invalidCount,
            valid: resultCount.validCount,
          })}
        />
        <Table<ImportResultRow>
          rowKey="index"
          size="small"
          columns={columns}
          dataSource={resultData.map((text, index) => ({ index: index + 1, message: text }))}
          pagination={false}
          scroll={{ y: 360 }}
        />
      </Modal>
    </>
  );
}

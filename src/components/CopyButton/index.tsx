import { App, Button, Tooltip } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface CopyButtonProps {
  /** 要复制到剪贴板的文本 */
  text?: string;
  /** 按钮提示文案，缺省为「复制」 */
  tip?: string;
  /** 外层类名，用于表格单元格内调整间距 */
  className?: string;
}

/** 复制按钮 */
export default function CopyButton({ text = "", tip, className }: CopyButtonProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();

  function handleCopy() {
    if (!text) return;

    navigator.clipboard?.writeText(text).then(
      () => message.success(t("common.copySuccess")),
      () => copyByExecCommand(text)
    );
  }

  /**
   * 降级复制：Clipboard API 在非安全上下文不可用
   */
  function copyByExecCommand(value: string) {
    const input = document.createElement("input");
    input.style.position = "absolute";
    input.style.left = "-9999px";
    input.setAttribute("value", value);
    document.body.appendChild(input);
    input.select();

    try {
      if (document.execCommand("copy")) {
        message.success(t("common.copySuccess"));
      } else {
        message.warning(t("common.copyFail"));
      }
    } finally {
      document.body.removeChild(input);
    }
  }

  return (
    <Tooltip title={tip ?? t("common.copy")}>
      <Button
        type="text"
        size="small"
        className={`copy-button${className ? ` ${className}` : ""}`}
        icon={<CopyOutlined />}
        onClick={handleCopy}
      />
    </Tooltip>
  );
}

import { Button, Tooltip } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface RefreshButtonProps {
  /**
   * 刷新回调
   */
  onClick: () => void;
  /** 是否处于加载中，请求期间按钮转圈且不重复触发 */
  loading?: boolean;
}

/**
 * 列表刷新按钮
 */
export default function RefreshButton({ onClick, loading }: RefreshButtonProps) {
  const { t } = useTranslation();

  return (
    <Tooltip title={t("tagsView.refresh")}>
      <Button icon={<ReloadOutlined />} loading={loading} onClick={onClick} />
    </Tooltip>
  );
}

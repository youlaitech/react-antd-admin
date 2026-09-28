import { useNavigate } from "react-router-dom";
import { Button, Result } from "antd";
import { useTranslation } from "react-i18next";

import { HOME_PATH } from "@/constants";

/**
 * 404 页面
 */
export default function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="404"
      subTitle={t("error.notFound")}
      extra={
        <Button type="primary" onClick={() => navigate(HOME_PATH, { replace: true })}>
          {t("common.backHome")}
        </Button>
      }
    />
  );
}

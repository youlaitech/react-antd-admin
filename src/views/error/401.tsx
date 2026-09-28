import { useNavigate } from "react-router-dom";
import { Button, Result } from "antd";
import { useTranslation } from "react-i18next";

import { HOME_PATH } from "@/constants";

/**
 * 401 页面
 */
export default function Forbidden() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title="401"
      subTitle={t("error.forbidden")}
      extra={
        <Button type="primary" onClick={() => navigate(HOME_PATH, { replace: true })}>
          {t("common.backHome")}
        </Button>
      }
    />
  );
}

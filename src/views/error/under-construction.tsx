import { useLocation, useNavigate } from "react-router-dom";
import { Button, Result } from "antd";
import { useTranslation } from "react-i18next";

import { HOME_PATH } from "@/constants";

/** 页面建设中 */
export default function UnderConstruction() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Result
      status="info"
      title={t("error.underConstruction")}
      subTitle={t("error.underConstructionDesc", { path: pathname })}
      extra={
        <Button type="primary" onClick={() => navigate(HOME_PATH, { replace: true })}>
          {t("common.backHome")}
        </Button>
      }
    />
  );
}

import { Card, Input } from "antd";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";

/**
 * 详情页
 */
export default function Detail() {
  const { t } = useTranslation();
  const params = useParams();
  const [searchParams] = useSearchParams();

  return (
    <div className="page-container">
      <Card className="page-content">
        <div className="flex flex-col gap-4">
          <div>
            {t("demo.detail.params")}：{JSON.stringify(params)}
          </div>
          <div>
            {t("demo.detail.query")}：{JSON.stringify(Object.fromEntries(searchParams))}
          </div>
          <Input className="w-300px" placeholder={t("demo.detail.cachePlaceholder")} />
        </div>
      </Card>
    </div>
  );
}

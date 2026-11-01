import { Tag } from "antd";
import { useTranslation } from "react-i18next";

// 概览三格的文案与色调，数值是演示数据，接入待办统计后替换
const summaryItems = [
  { labelKey: "dashboard.todayNew", value: 3, tone: "primary" },
  { labelKey: "dashboard.almostTimeout", value: 1, tone: "warning" },
  { labelKey: "dashboard.todayDone", value: 1, tone: "success" },
];

// 待办分类，进度条宽度由各项占比算出，数值改动后不用再手改百分比
const categoryItems = [
  { labelKey: "dashboard.todoApprove", value: 2 },
  { labelKey: "dashboard.todoReview", value: 1 },
  { labelKey: "dashboard.todoNotice", value: 1 },
  { labelKey: "dashboard.todoTicket", value: 1 },
];

/**
 * 待办概览
 */
export default function TodoOverview() {
  const { t } = useTranslation();

  const totalCount = categoryItems.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="dash-card dash-card--overview">
      <div className="dash-card__head">
        <h3 className="dash-card__title">{t("dashboard.todoOverview")}</h3>
        <Tag color="processing">{t("dashboard.todoPending", { count: totalCount })}</Tag>
      </div>

      <div className="dash-card__body dash-card__body--overview">
        <div className="overview-summary">
          {summaryItems.map((item) => (
            <div key={item.labelKey} className={`overview-summary__item is-${item.tone}`}>
              <span className="overview-summary__label">{t(item.labelKey)}</span>
              <strong className="overview-summary__value">{item.value}</strong>
            </div>
          ))}
        </div>

        <div className="overview-bars">
          {categoryItems.map((item) => (
            <div key={item.labelKey} className="overview-bars__item">
              <div className="overview-bars__meta">
                <span className="overview-bars__label">
                  <span className="overview-bars__dot" />
                  {t(item.labelKey)}
                </span>
                <span className="overview-bars__value">
                  {t("dashboard.todoCount", { count: item.value })}
                </span>
              </div>
              <span className="overview-bars__track">
                <span
                  className="overview-bars__bar"
                  style={{ width: `${Math.round((item.value / totalCount) * 100)}%` }}
                />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

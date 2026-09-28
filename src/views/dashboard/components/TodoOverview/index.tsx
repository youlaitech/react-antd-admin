import { Tag } from "antd";
import { useTranslation } from "react-i18next";

// 演示数据，接入待办接口后替换
const summaryItems = [
  { labelKey: "dashboard.todayNew", value: 3, tone: "primary" },
  { labelKey: "dashboard.almostTimeout", value: 1, tone: "warning" },
  { labelKey: "dashboard.todayDone", value: 1, tone: "success" },
];

const categoryItems = [
  { label: "审批", value: 2, percent: 40 },
  { label: "审核", value: 1, percent: 20 },
  { label: "通知", value: 1, percent: 20 },
  { label: "工单", value: 1, percent: 20 },
];

/**
 * 待办概览
 */
export default function TodoOverview() {
  const { t } = useTranslation();

  return (
    <div className="dash-card dash-card--overview">
      <div className="dash-card__head">
        <h3 className="dash-card__title">{t("dashboard.todoOverview")}</h3>
        <Tag color="processing">{t("dashboard.todoPending", { count: 5 })}</Tag>
      </div>

      <div className="dash-card__body">
        <div className="overview-summary">
          {summaryItems.map((item) => (
            <div key={item.labelKey} className="overview-summary__item">
              <span className="overview-summary__label">{t(item.labelKey)}</span>
              <strong className={`overview-summary__value is-${item.tone}`}>{item.value}</strong>
            </div>
          ))}
        </div>

        <div className="overview-bars">
          {categoryItems.map((item) => (
            <div key={item.label} className="overview-bars__item">
              <div className="overview-bars__meta">
                <span className="overview-bars__label">
                  <span className="overview-bars__dot" />
                  {item.label}
                </span>
                <span className="overview-bars__value">{item.value} 项</span>
              </div>
              <span className="overview-bars__track">
                <span className="overview-bars__bar" style={{ width: `${item.percent}%` }} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

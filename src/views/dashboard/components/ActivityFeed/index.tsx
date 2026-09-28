import { useTranslation } from "react-i18next";

interface Activity {
  id: number;
  content: string;
  time: string;
}

// 演示数据，接入操作日志接口后替换
const activities: Activity[] = [
  { id: 1, content: "管理员 admin 登录系统", time: "3分钟前" },
  { id: 2, content: "新增用户李四，角色为普通用户", time: "25分钟前" },
  { id: 3, content: "系统配置项「登录策略」已更新", time: "1小时前" },
  { id: 4, content: "数据库自动备份任务执行完成", time: "3小时前" },
  { id: 5, content: "角色权限批量修改：运营组新增导出权限", time: "昨天 16:42" },
  { id: 6, content: "SSL 证书已自动续期", time: "昨天 09:15" },
];

/**
 * 系统动态
 */
export default function ActivityFeed() {
  const { t } = useTranslation();

  return (
    <div className="dash-card">
      <div className="dash-card__head">
        <h3 className="dash-card__title">{t("dashboard.systemActivity")}</h3>
      </div>

      <div className="dash-card__body dash-card__body--scroll">
        <div className="feed">
          {activities.map((item) => (
            <div key={item.id} className="feed__item">
              <span className="feed__dot" />
              <span className="feed__text">{item.content}</span>
              <span className="feed__time">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Avatar } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  EyeOutlined,
  TeamOutlined,
  UserOutlined,
  VideoCameraOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import AnalyticsAPI from "@/api/analytics";
import type { UserSummary, VisitSummary } from "@/api/analytics";
import MenuIcon from "@/components/MenuIcon";
import { LanguageEnum } from "@/enums";
import { useCountUp } from "@/hooks/useCountUp";
import { useOnlineUserCount } from "@/hooks/useOnlineUserCount";
import { useAppStore } from "@/stores/app";
import { useUserStore } from "@/stores/user";
import { formatGrowthRate } from "@/utils";
import ActivityFeed from "./components/ActivityFeed";
import TodoList from "./components/TodoList";
import TodoOverview from "./components/TodoOverview";
import VisitTrendChart from "./components/VisitTrendChart";
import "./index.scss";

const EMPTY_SUMMARY: VisitSummary = {
  todayUv: 0,
  yesterdayUv: 0,
  totalUv: 0,
  todayPv: 0,
  yesterdayPv: 0,
  totalPv: 0,
  uvGrowthRate: null,
  pvGrowthRate: null,
};

interface QuickLink {
  key: string;
  href: string;
  /** 入口图标：本地 SVG 走 MenuIcon，antd 图标直接给节点 */
  icon: ReactNode;
  /** 直接展示的文案，与 labelKey 二选一 */
  label?: string;
  labelKey?: string;
}

// 项目入口。label 是专有名词，不做翻译；只有通用词（如文档、视频）才走语言包
const quickLinks: QuickLink[] = [
  {
    key: "gitee",
    href: "https://gitee.com/youlaiorg/react-antd-admin",
    label: "Gitee",
    icon: <MenuIcon icon="gitee" />,
  },
  {
    key: "github",
    href: "https://github.com/youlaiorg/react-antd-admin",
    label: "GitHub",
    icon: <MenuIcon icon="github" />,
  },
  {
    key: "gitcode",
    href: "https://gitcode.com/youlaiorg/react-antd-admin",
    label: "GitCode",
    icon: <MenuIcon icon="gitcode" />,
  },
  {
    key: "docs",
    href: "https://www.youlai.tech/docs/web/",
    labelKey: "dashboard.doc",
    icon: <MenuIcon icon="document" />,
  },
  {
    key: "video",
    href: "https://www.bilibili.com/video/BV1eFUuYyEFj",
    labelKey: "dashboard.video",
    icon: (
      <span className="menu-icon-svg">
        <VideoCameraOutlined />
      </span>
    ),
  },
];

/**
 * 首页控制台
 */
export default function Dashboard() {
  const { t } = useTranslation();

  const userInfo = useUserStore((state) => state.userInfo);
  const language = useAppStore((state) => state.language);
  const { onlineUserCount, isConnected } = useOnlineUserCount();

  const [summary, setSummary] = useState<VisitSummary>(EMPTY_SUMMARY);
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);

  // 三个会变化的数字走滚动过渡，系统用户数是静态值，不需要
  const onlineCount = useCountUp(onlineUserCount ?? 0);
  const uvCount = useCountUp(summary.todayUv);
  const pvCount = useCountUp(summary.todayPv);

  useEffect(() => {
    AnalyticsAPI.getVisitSummary()
      .then(setSummary)
      .catch((error) => console.warn(error));
    AnalyticsAPI.getUserSummary()
      .then(setUserSummary)
      .catch((error) => console.warn(error));
  }, []);

  // 按时段给出问候语
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = userInfo.nickname ?? userInfo.username ?? "";

    if (hour >= 6 && hour < 8) return t("dashboard.greetingDawn", { name });
    if (hour >= 8 && hour < 12) return t("dashboard.greetingForenoon", { name });
    if (hour >= 12 && hour < 18) return t("dashboard.greetingAfternoon", { name });
    if (hour >= 18 && hour < 24) return t("dashboard.greetingEvening", { name });
    return t("dashboard.greetingLateNight", { name });
  }, [t, userInfo]);

  // 交给浏览器本地化，省掉一套日期语言包
  const dateText = useMemo(
    () =>
      new Date().toLocaleDateString(language === LanguageEnum.EN_US ? "en-US" : "zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      }),
    [language],
  );

  const uvGrowthText = summary.uvGrowthRate == null ? "--" : formatGrowthRate(summary.uvGrowthRate);
  const pvGrowthText = summary.pvGrowthRate == null ? "--" : formatGrowthRate(summary.pvGrowthRate);
  const uvIsUp = (summary.uvGrowthRate ?? 0) > 0;
  const pvIsUp = (summary.pvGrowthRate ?? 0) > 0;

  return (
    <div className="page-container dash">
      <section className="dash-card dash-header">
        <div className="dash-header__start">
          <Avatar size={44} src={userInfo.avatar} icon={<UserOutlined />} />
          <div className="dash-header__text">
            <h1 className="dash-header__greeting">{greeting}</h1>
            <p className="dash-header__date">{dateText}</p>
          </div>
        </div>

        <div className="dash-header__end">
          {quickLinks.map((link) => (
            <a
              key={link.key}
              className="quick-link"
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.icon}
              <span>{link.labelKey ? t(link.labelKey) : link.label}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="dash-stats">
        <div className="stat-card">
          <span className="stat-card__icon is-online">
            <WifiOutlined />
          </span>
          <div className="stat-card__body">
            <span className="stat-card__label">{t("dashboard.onlineUsers")}</span>
            <span className="stat-card__num">{onlineUserCount === null ? "--" : onlineCount}</span>
          </div>
          <span className={`stat-card__badge ${isConnected ? "is-on" : "is-off"}`}>
            {isConnected ? t("dashboard.realtime") : t("dashboard.offline")}
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card__icon is-visitor">
            <UserOutlined />
          </span>
          <div className="stat-card__body">
            <span className="stat-card__label">{t("dashboard.todayVisitors")}</span>
            <span className="stat-card__num">{uvCount}</span>
          </div>
          {uvGrowthText !== "--" && (
            <span className={`stat-card__trend ${uvIsUp ? "is-up" : "is-down"}`}>
              {uvIsUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {uvGrowthText}
            </span>
          )}
        </div>

        <div className="stat-card">
          <span className="stat-card__icon is-view">
            <EyeOutlined />
          </span>
          <div className="stat-card__body">
            <span className="stat-card__label">{t("dashboard.todayViews")}</span>
            <span className="stat-card__num">{pvCount}</span>
          </div>
          {pvGrowthText !== "--" && (
            <span className={`stat-card__trend ${pvIsUp ? "is-up" : "is-down"}`}>
              {pvIsUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {pvGrowthText}
            </span>
          )}
        </div>

        <div className="stat-card">
          <span className="stat-card__icon is-account">
            <TeamOutlined />
          </span>
          <div className="stat-card__body">
            <span className="stat-card__label">{t("dashboard.systemUsers")}</span>
            <span className="stat-card__num">
              {userSummary ? userSummary.total.toLocaleString("en-US") : "--"}
            </span>
          </div>
        </div>
      </section>

      <section className="dash-chart">
        <VisitTrendChart />
        <TodoOverview />
      </section>

      <section className="dash-bottom">
        <TodoList />
        <ActivityFeed />
      </section>
    </div>
  );
}

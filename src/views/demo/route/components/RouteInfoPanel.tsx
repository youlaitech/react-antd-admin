import { useMemo } from "react";
import { Descriptions, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { useLocation, useParams } from "react-router-dom";

import { findRouteMeta, resolveRouteInfo } from "@/router/menu";
import { usePermissionStore } from "@/stores/permission";

interface RouteInfoPanelProps {
  /** 面板标题 */
  title: string;
  /** 标题下方的补充说明 */
  description?: string;
}

/**
 * 把空对象与空值统一显示为「无」，避免面板出现 {} 这种无信息量内容
 */
function formatValue(value: unknown): string {
  if (!value || typeof value !== "object") return "无";
  return Object.keys(value as object).length ? JSON.stringify(value) : "无";
}

/** 路由信息面板 */
export default function RouteInfoPanel({ title, description }: RouteInfoPanelProps) {
  const { t } = useTranslation();
  const { pathname, search } = useLocation();
  const params = useParams();
  const menuRoutes = usePermissionStore((state) => state.menuRoutes);

  const meta = findRouteMeta(menuRoutes, pathname);
  const routeInfo = resolveRouteInfo(pathname, menuRoutes, t);

  const query = useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);

  // 匹配链：按路径逐段累积，能对应到菜单的段带上菜单标题
  const matchedChain = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join("/")}`;
      return {
        name: resolveRouteInfo(path, menuRoutes, t).title || t("demo.routeInfo.unnamed"),
        path,
      };
    });
  }, [menuRoutes, pathname, t]);

  const keepAlive = meta?.keepAlive === true;

  return (
    <section className="route-info">
      <header className="route-info__header">
        <h3 className="route-info__title">{title}</h3>
        {description && <p className="route-info__desc">{description}</p>}
      </header>

      <Descriptions
        column={2}
        bordered
        size="small"
        items={[
          {
            key: "name",
            label: t("demo.routeInfo.name"),
            children: routeInfo.title || "-",
          },
          {
            key: "fullPath",
            label: t("demo.routeInfo.fullPath"),
            children: `${pathname}${search}`,
          },
          {
            key: "params",
            label: t("demo.routeInfo.params"),
            children: formatValue(params),
          },
          {
            key: "query",
            label: t("demo.routeInfo.query"),
            children: formatValue(query),
          },
          {
            key: "keepAlive",
            label: t("demo.routeInfo.keepAlive"),
            children: (
              <Tag color={keepAlive ? "success" : "default"}>
                {keepAlive ? t("demo.routeInfo.keepOn") : t("demo.routeInfo.keepOff")}
              </Tag>
            ),
          },
          {
            key: "metaParams",
            label: t("demo.routeInfo.metaParams"),
            children: formatValue(meta?.params),
          },
          {
            key: "matched",
            label: t("demo.routeInfo.matched"),
            span: 2,
            children: (
              <span className="route-info__chain">
                {matchedChain.map((item) => (
                  <span key={item.path} className="route-info__chain-item">
                    <Tag>{item.name}</Tag>
                    <code>{item.path}</code>
                  </span>
                ))}
              </span>
            ),
          },
        ]}
      />
    </section>
  );
}

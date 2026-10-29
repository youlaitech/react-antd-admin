import { Empty } from "antd";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import { findRouteMeta } from "@/router/menu";
import { usePermissionStore } from "@/stores/permission";

/**
 * 内嵌外链页
 */
export default function Iframe() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const menuRoutes = usePermissionStore((state) => state.menuRoutes);

  const meta = findRouteMeta(menuRoutes, pathname);
  const url = typeof meta?.externalUrl === "string" ? meta.externalUrl : "";

  if (!url) {
    return (
      <div className="page-container">
        <Empty description={t("common.iframeEmpty")} />
      </div>
    );
  }

  return (
    <div className="iframe-page">
      <iframe src={url} title={meta?.title ?? "iframe"} />
    </div>
  );
}

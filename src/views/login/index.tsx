import { useState } from "react";
import { Button, ConfigProvider, Segmented, Tooltip } from "antd";
import { ClockCircleOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import logo from "@/assets/images/logo.png";
import { LanguageEnum, ThemeMode } from "@/enums";
import { appConfig } from "@/settings";
import { useAppStore } from "@/stores/app";
import AccountLogin from "./components/AccountLogin";
import ResetPassword from "./components/ResetPassword";
import "./index.scss";

/**
 * 右侧卡片展示的视图
 */
type LoginView = "login" | "resetPwd";

/**
 * 登录页
 */
export default function Login() {
  const { t } = useTranslation();

  const theme = useAppStore((state) => state.theme);
  const language = useAppStore((state) => state.language);
  const setTheme = useAppStore((state) => state.setTheme);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const [view, setView] = useState<LoginView>("login");

  return (
    // 用组件级 token 覆盖控件尺寸，由 antd 推算内边距与行高
    <ConfigProvider theme={{ components: { Input: { controlHeightLG: 44 } } }}>
      <div className="login-page">
        <div className="login-toolbar">
          <Tooltip
            title={
              theme === ThemeMode.DARK ? t("settings.switchToLight") : t("settings.switchToDark")
            }
          >
            <Button
              type="text"
              shape="circle"
              icon={theme === ThemeMode.DARK ? <MoonOutlined /> : <SunOutlined />}
              onClick={() => setTheme(theme === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK)}
            />
          </Tooltip>

          <Segmented
            size="small"
            value={language}
            options={[
              { label: "中文", value: LanguageEnum.ZH_CN },
              { label: "English", value: LanguageEnum.EN_US },
            ]}
            onChange={(value) => setLanguage(value as LanguageEnum)}
          />
        </div>

        <div className="login-layout">
          <div className="login-brand">
            <div className="login-brand__header">
              <img className="login-brand__logo" src={logo} alt={appConfig.title} />
              <div className="login-brand__identity">
                <span className="login-brand__name">{appConfig.title}</span>
                <span className="login-brand__version">v{appConfig.version}</span>
              </div>
            </div>

            <div className="login-brand__hero">
              <div>
                <span className="login-brand__tag">
                  <span className="login-brand__tag-dot" />
                  {t("login.enterpriseReady")}
                </span>
                <h1 className="login-brand__title">{t("login.slogan")}</h1>
              </div>

              <div className="login-brand__features">
                <div className="login-brand__feature">
                  <span className="login-brand__feature-mark">
                    <i className="i-svg:security" />
                  </span>
                  <span className="login-brand__feature-text">{t("login.featureSecure")}</span>
                </div>
                <div className="login-brand__feature">
                  <span className="login-brand__feature-mark">
                    <ClockCircleOutlined />
                  </span>
                  <span className="login-brand__feature-text">{t("login.featureStable")}</span>
                </div>
                <div className="login-brand__feature">
                  <span className="login-brand__feature-mark">
                    <i className="i-svg:flexible" />
                  </span>
                  <span className="login-brand__feature-text">{t("login.featureFlexible")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="login-card">
            <div className="login-card__inner">
              {view === "login" && (
                <AccountLogin key="login" onSwitchToReset={() => setView("resetPwd")} />
              )}

              {view === "resetPwd" && (
                <ResetPassword key="resetPwd" onSwitch={() => setView("login")} />
              )}
            </div>

            <div className="login-footer">{t("login.copyright")}</div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Avatar, Button, Spin } from "antd";
import {
  ArrowLeftOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import QRCode from "qrcode";
import { useTranslation } from "react-i18next";

import AuthAPI from "@/api/auth";
import type { QrCodeStatus, QrCodeStatusResult } from "@/api/auth";
import { HOME_PATH } from "@/constants";
import { useUserStore } from "@/stores/user";
import "./index.scss";

// 界面状态机：loading(生成中) → waiting(待扫码) → scanned(已扫码待确认)
// → done(已登录) / expired(过期或已使用) / canceled(APP 取消)
type QrViewState = "loading" | "waiting" | "scanned" | "expired" | "canceled" | "done";

// 轮询间隔（毫秒）
const POLL_INTERVAL = 2000;

interface QrCodeLoginProps {
  /** 切回账号登录 */
  onSwitch: () => void;
}

/** 扫码登录 */
export default function QrCodeLogin({ onSwitch }: QrCodeLoginProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginByQrCode = useUserStore((state) => state.loginByQrCode);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [viewState, setViewState] = useState<QrViewState>("loading");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("");
  // 变化时重建二维码，用于「点击刷新」与「重新生成」
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let canceled = false;
    let ticket = "";
    let timer: ReturnType<typeof setTimeout> | null = null;

    function stopPolling() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    async function startPolling() {
      stopPolling();
      timer = setTimeout(pollOnce, POLL_INTERVAL);
    }

    async function doLogin() {
      stopPolling();
      if (canceled) return;

      setViewState("done");
      try {
        await loginByQrCode(ticket);
        if (canceled) return;

        const redirect = searchParams.get("redirect");
        navigate(redirect ? decodeURIComponent(redirect) : HOME_PATH, { replace: true });
      } catch {
        if (!canceled) setViewState("expired");
      }
    }

    function handleStatus(result: QrCodeStatusResult) {
      const status: QrCodeStatus = result.status;

      if (status === "WAITING") {
        setViewState("waiting");
        startPolling();
        return;
      }

      if (status === "SCANNED") {
        setViewState("scanned");
        setNickname(result.nickname ?? "");
        setAvatar(result.avatar ?? "");
        startPolling();
        return;
      }

      if (status === "CONFIRMED") {
        doLogin();
        return;
      }

      setViewState(status === "CANCELED" ? "canceled" : "expired");
    }

    async function pollOnce() {
      if (!ticket || canceled) return;

      try {
        const result = await AuthAPI.qrStatus(ticket);
        if (!canceled) handleStatus(result);
      } catch {
        // 单次轮询失败不终止流程，继续下一次
        if (!canceled) startPolling();
      }
    }

    async function start() {
      stopPolling();
      setViewState("loading");
      setNickname("");
      setAvatar("");

      try {
        const result = await AuthAPI.qrGenerate();
        if (canceled) return;

        ticket = result.ticket;
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, ticket, { width: 220, margin: 1 });
        }
        if (canceled) return;

        setViewState("waiting");
        startPolling();
      } catch {
        if (!canceled) setViewState("expired");
      }
    }

    start();

    return () => {
      canceled = true;
      stopPolling();
    };
  }, [refreshKey, loginByQrCode, navigate, searchParams]);

  return (
    <div className="qr-login">
      <h2 className="qr-login__title">{t("login.qrLogin")}</h2>
      <p className="qr-login__desc">{t("login.qrDesc")}</p>

      <div className="qr-login__board">
        {viewState === "loading" && (
          <div className="qr-login__mask">
            <Spin indicator={<LoadingOutlined spin />} />
            <span>{t("login.qrLoading")}</span>
          </div>
        )}

        {viewState === "scanned" && (
          <div className="qr-login__mask qr-login__mask--info">
            <Avatar size={56} src={avatar || undefined} icon={<UserOutlined />} />
            <span className="qr-login__mask-text">{t("login.qrScanned", { name: nickname })}</span>
            <span className="qr-login__mask-hint">{t("login.qrScannedHint")}</span>
          </div>
        )}

        {(viewState === "expired" || viewState === "canceled") && (
          <div className="qr-login__mask">
            <CloseCircleOutlined className="qr-login__mask-icon" />
            <span>{viewState === "expired" ? t("login.qrExpired") : t("login.qrCanceled")}</span>
            <Button type="link" onClick={() => setRefreshKey((key) => key + 1)}>
              {viewState === "expired" ? t("login.qrRefresh") : t("login.qrRegenerate")}
            </Button>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="qr-login__canvas"
          style={{ visibility: viewState === "waiting" ? "visible" : "hidden" }}
        />
      </div>

      <div className="qr-login__footer">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onSwitch}>
          {t("login.backToLogin")}
        </Button>
      </div>
    </div>
  );
}

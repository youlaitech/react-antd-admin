import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { App as AntdApp, Button, Checkbox, Form, Input, Spin, Tooltip } from "antd";
import { LoadingOutlined, LockOutlined, ReloadOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import AuthAPI from "@/api/auth";
import type { LoginRequest } from "@/api/auth";
import { HOME_PATH } from "@/constants";
import { useUserStore } from "@/stores/user";
import { AuthStorage } from "@/utils/auth";

// 演示账号，点击填入表单
const demoAccounts = [{ username: "admin", labelKey: "login.demoAdmin" }];

interface AccountLoginProps {
  /** 切换到扫码登录 */
  onSwitchToQrCode: () => void;
  /** 切换到重置密码 */
  onSwitchToReset: () => void;
}

/**
 * 账号密码登录
 */
export default function AccountLogin({ onSwitchToQrCode, onSwitchToReset }: AccountLoginProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { message } = AntdApp.useApp();

  const login = useUserStore((state) => state.login);

  const [form] = Form.useForm<LoginRequest>();
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [captchaBase64, setCaptchaBase64] = useState<string>();
  const [capsLock, setCapsLock] = useState(false);

  // 验证码请求序号，用于丢弃过期响应
  const captchaSeqRef = useRef(0);

  const getCaptcha = useCallback(async () => {
    const seq = captchaSeqRef.current + 1;
    captchaSeqRef.current = seq;

    setCodeLoading(true);
    try {
      const data = await AuthAPI.getCaptcha();

      // StrictMode 下 effect 会执行两次，两个请求的返回顺序不确定。
      // 不过滤过期响应的话，会出现「显示的是上一张图、captchaId 却是新的」，验证码永远对不上
      if (seq !== captchaSeqRef.current) return;

      form.setFieldValue("captchaId", data.captchaId);
      setCaptchaBase64(data.captchaBase64);
    } catch (error) {
      console.warn(error);
    } finally {
      if (seq === captchaSeqRef.current) {
        setCodeLoading(false);
      }
    }
  }, [form]);

  useEffect(() => {
    getCaptcha();
  }, [getCaptcha]);

  async function handleSubmit(values: LoginRequest) {
    setLoading(true);
    try {
      await login(values);
      message.success(t("login.success"));

      // 带上来源地址，登录后回到被拦截的页面
      const redirect = searchParams.get("redirect");
      navigate(redirect ? decodeURIComponent(redirect) : HOME_PATH, { replace: true });
    } catch (error) {
      // 失败提示由响应拦截器给出，换一张验证码让用户重新输入
      console.warn(error);
      getCaptcha();
    } finally {
      setLoading(false);
    }
  }

  function handlePasswordKeyUp(event: ReactKeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState("CapsLock"));
  }

  function fillDemoAccount(username: string) {
    form.setFieldsValue({ username, password: "123456" });
  }

  return (
    <div className="account-login">
      <h2 className="login-card__title">{t("login.welcome")}</h2>
      <p className="login-card__desc">{t("login.welcomeDesc")}</p>

      <Form<LoginRequest>
        form={form}
        size="large"
        className="login-form"
        initialValues={{
          username: "youlai",
          password: "123456",
          rememberMe: AuthStorage.getRememberMe(),
        }}
        onFinish={handleSubmit}
      >
        {/* 验证码标识随表单一起提交，antd 只回传注册过的字段，隐藏字段也要占位 */}
        <Form.Item name="captchaId" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          name="username"
          rules={[{ required: true, message: t("login.usernameRequired") }]}
        >
          <Input prefix={<UserOutlined />} placeholder={t("login.username")} />
        </Form.Item>

        <Tooltip open={capsLock} title={t("login.capsLock")} placement="right">
          <Form.Item
            name="password"
            rules={[
              { required: true, message: t("login.passwordRequired") },
              { min: 6, message: t("login.passwordMin") },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t("login.password")}
              onKeyUp={handlePasswordKeyUp}
            />
          </Form.Item>
        </Tooltip>

        <div className="captcha-row">
          <Form.Item
            name="captchaCode"
            className="captcha-row__input"
            rules={[{ required: true, message: t("login.captchaRequired") }]}
          >
            <Input
              prefix={<i className="input-prefix-icon i-svg:security" />}
              placeholder={t("login.captcha")}
            />
          </Form.Item>

          <div className="captcha-img" onClick={getCaptcha}>
            {codeLoading ? (
              <Spin indicator={<LoadingOutlined spin />} size="small" />
            ) : captchaBase64 ? (
              <img src={captchaBase64} alt={t("login.captcha")} />
            ) : (
              <ReloadOutlined />
            )}
          </div>
        </div>

        <div className="login-options">
          <Form.Item name="rememberMe" valuePropName="checked" noStyle>
            <Checkbox>{t("login.rememberMe")}</Checkbox>
          </Form.Item>
          <span className="login-options__link" onClick={onSwitchToReset}>
            {t("login.forgetPassword")}
          </span>
        </div>

        <Button
          className="login-btn"
          type="primary"
          size="large"
          block
          loading={loading}
          htmlType="submit"
        >
          {t("login.submit")}
        </Button>
      </Form>

      <div className="login-demo">
        <div className="login-demo__title">{t("login.demoTitle")}</div>
        <div className="login-demo__accounts">
          {demoAccounts.map((account) => (
            <button
              key={account.username}
              type="button"
              className="login-demo__chip"
              onClick={() => fillDemoAccount(account.username)}
            >
              {t(account.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="login-alt">
        <div className="login-alt__divider">{t("login.otherWays")}</div>
        <div className="login-alt__buttons">
          <button type="button" className="login-alt__btn" onClick={onSwitchToQrCode}>
            <span className="login-alt__icon">
              <i className="i-svg:scan" />
            </span>
            {t("login.qrLogin")}
          </button>
          <button
            type="button"
            className="login-alt__btn"
            onClick={() => message.info(t("login.ssoTip"))}
          >
            <span className="login-alt__icon">
              <i className="i-svg:security" />
            </span>
            {t("login.ssoLogin")}
          </button>
        </div>
      </div>
    </div>
  );
}

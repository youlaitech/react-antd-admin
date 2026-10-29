import { App as AntdApp, Button, Form, Input, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import "./index.scss";

interface ResetPasswordProps {
  /**
   * 切回账号登录
   */
  onSwitch: () => void;
}

/**
 * 重置密码
 */
export default function ResetPassword({ onSwitch }: ResetPasswordProps) {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<{ username: string }>();

  async function handleSubmit() {
    // 这个函数只挂在 Form 的 onFinish 上，onFinish 本身就在校验通过后才触发，
    // 再调一次 validateFields 是多余的
    message.warning(t("login.resetPwdTip"));
  }

  return (
    <div className="login-reset">
      <h2 className="login-card__title">{t("login.resetPassword")}</h2>

      <Form form={form} size="large" className="login-form" onFinish={handleSubmit}>
        <Form.Item
          name="username"
          rules={[{ required: true, message: t("login.usernameRequired") }]}
        >
          <Input prefix={<UserOutlined />} placeholder={t("login.username")} />
        </Form.Item>

        <Form.Item className="mb-0">
          <Button className="login-btn" type="primary" size="large" block htmlType="submit">
            {t("login.resetPassword")}
          </Button>
        </Form.Item>
      </Form>

      <div className="login-reset__footer">
        <Typography.Text type="secondary">{t("login.thinkOfPasswd")}</Typography.Text>
        <Button type="link" onClick={onSwitch}>
          {t("login.submit")}
        </Button>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import {
  App as AntdApp,
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Progress,
  Space,
  Tag,
  Upload,
} from "antd";
import {
  CalendarOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  DesktopOutlined,
  EditOutlined,
  EnvironmentOutlined,
  KeyOutlined,
  LineChartOutlined,
  LockOutlined,
  MailOutlined,
  MobileOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import FileAPI from "@/api/file";
import UserAPI from "@/api/system/user";
import type {
  EmailUpdateForm,
  MobileUpdateForm,
  PasswordChangeForm,
  UserProfileDetail,
  UserProfileForm,
} from "@/api/system/user";
import DictSelect from "@/components/DictSelect";
import { useUserStore } from "@/stores/user";
import { validateForm } from "@/utils/form";

import "./index.scss";

// 验证码倒计时秒数
const COUNTDOWN_SECONDS = 60;

/**
 * 弹窗类型
 */
type DialogType = "account" | "password" | "mobile" | "email" | "unbindMobile" | "unbindEmail";

// 近期登录记录
const RECENT_LOGIN_RECORDS = [
  {
    device: "Chrome / Windows",
    location: "上海",
    ip: "192.168.1.26",
    time: "2026-06-20 09:32",
  },
  {
    device: "Edge / Windows",
    location: "杭州",
    ip: "192.168.1.18",
    time: "2026-06-19 18:46",
  },
  {
    device: "Safari / iOS",
    location: "深圳",
    ip: "192.168.1.12",
    time: "2026-06-18 14:08",
  },
];

/**
 * 个人中心
 */
export default function Profile() {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();

  const [accountForm] = Form.useForm<UserProfileForm>();
  const [passwordForm] = Form.useForm<PasswordChangeForm>();
  const [mobileForm] = Form.useForm<MobileUpdateForm>();
  const [emailForm] = Form.useForm<EmailUpdateForm>();
  const [unbindForm] = Form.useForm<{ password: string }>();

  const userInfo = useUserStore((state) => state.userInfo);
  const getUserInfo = useUserStore((state) => state.getUserInfo);

  const [profile, setProfile] = useState<UserProfileDetail>({});
  const [dialogType, setDialogType] = useState<DialogType>("account");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mobileCountdown, setMobileCountdown] = useState(0);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const mobileTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emailTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchProfile();
    return () => {
      stopCountdown(mobileTimerRef);
      stopCountdown(emailTimerRef);
    };
  }, []);

  /**
   * 清理倒计时定时器
   */
  function stopCountdown(timerRef: React.RefObject<ReturnType<typeof setInterval> | null>) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  /**
   * 启动验证码倒计时
   */
  function startCountdown(
    timerRef: React.RefObject<ReturnType<typeof setInterval> | null>,
    setter: React.Dispatch<React.SetStateAction<number>>,
  ) {
    stopCountdown(timerRef);
    setter(COUNTDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setter((prev) => {
        if (prev <= 1) {
          stopCountdown(timerRef);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function fetchProfile() {
    try {
      const data = await UserAPI.getProfile();
      setProfile(data ?? {});
    } catch (error) {
      // 提示已由响应拦截器给出，这里只记录日志
      console.warn(error);
    }
  }

  const displayAvatar = profile.avatar || userInfo.avatar || "";
  const displayName =
    profile.nickname || userInfo.nickname || profile.username || userInfo.username || "-";

  const roleList = useMemo(
    () =>
      (profile.roleNames || "")
        .split(/[,，]/)
        .map((role) => role.trim())
        .filter(Boolean),
    [profile.roleNames],
  );

  const genderText = useMemo(() => {
    if (profile.gender === 1) return t("system.user.male");
    if (profile.gender === 2) return t("system.user.female");
    return t("profile.genderUnset");
  }, [profile.gender, t]);

  const permissionCount = userInfo.perms?.length ?? 0;

  const boundCount = [profile.mobile, profile.email].filter(Boolean).length;

  // 资料完善度：按已填字段占比计算
  const profileCompletion = useMemo(() => {
    const fields = [
      profile.username,
      profile.nickname,
      displayAvatar,
      profile.mobile,
      profile.email,
      profile.deptName,
      profile.roleNames,
      profile.createTime,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [displayAvatar, profile]);

  // 安全等级：已绑定项越多越高
  const securityLevel = useMemo(() => {
    const score = 60 + boundCount * 20;
    if (score >= 100) return { score, label: t("profile.securityHigh"), color: "success" as const };
    if (score >= 80)
      return { score, label: t("profile.securityMedium"), color: "warning" as const };
    return { score, label: t("profile.securityLow"), color: "default" as const };
  }, [boundCount, t]);

  /**
   * 打开弹窗并预填数据
   */
  function openDialog(type: DialogType) {
    setDialogType(type);
    setDialogOpen(true);

    if (type === "account") {
      accountForm.setFieldsValue({ nickname: profile.nickname, gender: profile.gender });
    }
    if (type === "mobile") {
      mobileForm.resetFields();
      mobileForm.setFieldsValue({ mobile: profile.mobile });
    }
    if (type === "email") {
      emailForm.resetFields();
      emailForm.setFieldsValue({ email: profile.email });
    }
    if (type === "password") passwordForm.resetFields();
    if (type === "unbindMobile" || type === "unbindEmail") unbindForm.resetFields();
  }

  /**
   * 上传头像并立即保存
   */
  async function handleAvatarUpload(file: File) {
    const info = await FileAPI.uploadFile(file);
    if (info?.url) {
      await UserAPI.updateProfile({ ...profile, avatar: info.url });
      message.success(t("common.saveSuccess"));
      fetchProfile();
      getUserInfo();
    }
    // 返回 false 交给这里自行上传，避免预览用本地地址
    return false;
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      if (dialogType === "account") {
        const values = await validateForm(accountForm);
        if (!values) return;

        await UserAPI.updateProfile(values);
        message.success(t("common.saveSuccess"));
        fetchProfile();
        getUserInfo();
      } else if (dialogType === "password") {
        const values = await validateForm(passwordForm);
        if (!values) return;

        await UserAPI.changePassword(values);
        message.success(t("profile.passwordChanged"));
      } else if (dialogType === "mobile") {
        const values = await validateForm(mobileForm);
        if (!values) return;

        await UserAPI.bindOrChangeMobile(values);
        message.success(t("profile.mobileChanged"));
        fetchProfile();
      } else if (dialogType === "email") {
        const values = await validateForm(emailForm);
        if (!values) return;

        await UserAPI.bindOrChangeEmail(values);
        message.success(t("profile.emailChanged"));
        fetchProfile();
      } else {
        const values = await validateForm(unbindForm);
        if (!values) return;

        const { password } = values;
        if (dialogType === "unbindMobile") {
          await UserAPI.unbindMobile({ password });
          message.success(t("profile.mobileUnbound"));
        } else {
          await UserAPI.unbindEmail({ password });
          message.success(t("profile.emailUnbound"));
        }
        fetchProfile();
      }

      setDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendMobileCode() {
    const mobile = mobileForm.getFieldValue("mobile");
    if (!mobile) {
      message.warning(t("profile.mobileRequired"));
      return;
    }
    await UserAPI.sendMobileCode(mobile);
    message.success(t("profile.codeSent"));
    startCountdown(mobileTimerRef, setMobileCountdown);
  }

  async function handleSendEmailCode() {
    const email = emailForm.getFieldValue("email");
    if (!email) {
      message.warning(t("profile.emailRequired"));
      return;
    }
    await UserAPI.sendEmailCode(email);
    message.success(t("profile.codeSent"));
    startCountdown(emailTimerRef, setEmailCountdown);
  }

  const dialogTitles: Record<DialogType, string> = {
    account: t("profile.editProfile"),
    password: t("profile.changePassword"),
    mobile: profile.mobile ? t("profile.changeMobile") : t("profile.bindMobile"),
    email: profile.email ? t("profile.changeEmail") : t("profile.bindEmail"),
    unbindMobile: t("profile.unbindMobile"),
    unbindEmail: t("profile.unbindEmail"),
  };

  // 个人信息条目
  const infoItems = [
    { label: t("system.user.username"), value: profile.username || "-" },
    { label: t("system.user.nickname"), value: profile.nickname || "-" },
    { label: t("system.user.gender"), value: genderText },
    { label: t("system.user.dept"), value: profile.deptName || t("profile.deptUnassigned") },
    { label: t("system.user.mobile"), value: profile.mobile || t("profile.unbound") },
    { label: t("system.user.email"), value: profile.email || t("profile.unbound") },
    { label: t("profile.roleNames"), value: roleList.join("、") || "-" },
    { label: t("common.createTime"), value: profile.createTime || "-" },
  ];

  // 账号概览统计项
  const accountStats = [
    {
      key: "score",
      label: t("profile.statScore"),
      value: securityLevel.score,
      suffix: t("profile.scoreSuffix"),
      icon: <KeyOutlined />,
      tone: "primary",
    },
    {
      key: "bound",
      label: t("profile.statBound"),
      value: boundCount,
      suffix: "/2",
      icon: <CheckCircleOutlined />,
      tone: "success",
    },
    {
      key: "roles",
      label: t("profile.statRoles"),
      value: roleList.length,
      suffix: t("profile.countSuffix"),
      icon: <TeamOutlined />,
      tone: "warning",
    },
    {
      key: "perms",
      label: t("profile.statPerms"),
      value: permissionCount,
      suffix: t("profile.countSuffix"),
      icon: <LineChartOutlined />,
      tone: "info",
    },
  ];

  // 安全设置条目
  const securityItems = [
    {
      key: "password",
      icon: <LockOutlined />,
      title: t("profile.loginPassword"),
      description: t("profile.loginPasswordDesc"),
      status: t("profile.set"),
      statusColor: "success" as const,
      actions: (
        <Button type="link" onClick={() => openDialog("password")}>
          {t("common.update")}
        </Button>
      ),
    },
    {
      key: "mobile",
      icon: <MobileOutlined />,
      title: t("system.user.mobile"),
      description: profile.mobile || t("profile.mobileUnboundDesc"),
      status: profile.mobile ? t("profile.bound") : t("profile.unbound"),
      statusColor: profile.mobile ? ("success" as const) : ("warning" as const),
      actions: (
        <Space size={0}>
          <Button type="link" onClick={() => openDialog("mobile")}>
            {profile.mobile ? t("profile.change") : t("profile.bind")}
          </Button>
          {profile.mobile && (
            <Button type="link" danger onClick={() => openDialog("unbindMobile")}>
              {t("profile.unbind")}
            </Button>
          )}
        </Space>
      ),
    },
    {
      key: "email",
      icon: <MailOutlined />,
      title: t("system.user.email"),
      description: profile.email || t("profile.emailUnboundDesc"),
      status: profile.email ? t("profile.bound") : t("profile.unbound"),
      statusColor: profile.email ? ("success" as const) : ("warning" as const),
      actions: (
        <Space size={0}>
          <Button type="link" onClick={() => openDialog("email")}>
            {profile.email ? t("profile.change") : t("profile.bind")}
          </Button>
          {profile.email && (
            <Button type="link" danger onClick={() => openDialog("unbindEmail")}>
              {t("profile.unbind")}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-hero__body">
          <div className="profile-avatar">
            <Avatar size={72} src={displayAvatar} icon={<UserOutlined />} />
            <Upload showUploadList={false} accept="image/*" beforeUpload={handleAvatarUpload}>
              <Button
                className="profile-avatar__action"
                shape="circle"
                size="small"
                icon={<CameraOutlined />}
              />
            </Upload>
          </div>

          <div className="profile-hero__info">
            <div className="profile-hero__title">
              <h2>{displayName}</h2>
              <Tag color="processing" className="m-0">
                {roleList[0] ?? t("profile.normalUser")}
              </Tag>
            </div>
            <p className="profile-hero__desc">
              {profile.username || "-"} / {profile.deptName || t("profile.deptUnassigned")}
            </p>
            <div className="profile-hero__meta">
              <span className="profile-hero__meta-item">
                <CalendarOutlined />
                {t("profile.joinedAt", { time: profile.createTime || "-" })}
              </span>
              <span className="profile-hero__meta-item">
                <EnvironmentOutlined />
                {t("profile.lastLoginAt", { time: RECENT_LOGIN_RECORDS[0].time })}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-hero__actions">
          <Button icon={<EditOutlined />} onClick={() => openDialog("account")}>
            {t("profile.editProfile")}
          </Button>
          <Button type="primary" icon={<LockOutlined />} onClick={() => openDialog("password")}>
            {t("profile.changePassword")}
          </Button>
        </div>
      </section>

      <div className="profile-page__layout">
        <aside className="profile-page__side">
          <Card
            className="profile-card"
            title={t("profile.profileInfo")}
            extra={<Tag className="m-0">{genderText}</Tag>}
          >
            <dl className="profile-info">
              {infoItems.map((item) => (
                <div className="profile-info__item" key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="profile-card" title={t("profile.accountOverview")}>
            <div className="profile-stats">
              {accountStats.map((item) => (
                <div className="profile-stats__item" key={item.key}>
                  <span className={`profile-icon is-${item.tone}`}>{item.icon}</span>
                  <div className="profile-stats__body">
                    <span className="profile-stats__label">{item.label}</span>
                    <strong className="profile-stats__value">
                      {item.value}
                      <em>{item.suffix}</em>
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            className="profile-card"
            title={t("profile.roleNames")}
            extra={t("profile.permCount", { count: permissionCount })}
          >
            <Space size={6} wrap>
              {roleList.length > 0 ? (
                roleList.map((role) => (
                  <Tag key={role} color="processing" className="m-0">
                    {role}
                  </Tag>
                ))
              ) : (
                <span className="profile-empty">{t("profile.noRole")}</span>
              )}
            </Space>
          </Card>
        </aside>

        <main className="profile-page__main">
          <Card
            className="profile-card"
            title={t("profile.security")}
            extra={
              <Tag color={securityLevel.color} className="m-0">
                {t("profile.securityLevel")} {securityLevel.label}
              </Tag>
            }
          >
            <div className="profile-security">
              {securityItems.map((item) => (
                <div className="profile-security__item" key={item.key}>
                  <span className="profile-security__icon">{item.icon}</span>
                  <div className="profile-security__body">
                    <div className="profile-security__title">
                      <span>{item.title}</span>
                      <Tag color={item.statusColor} className="m-0">
                        {item.status}
                      </Tag>
                    </div>
                    <p>{item.description}</p>
                  </div>
                  <div className="profile-security__actions">{item.actions}</div>
                </div>
              ))}
            </div>
          </Card>

          <div className="profile-page__grid">
            <Card
              className="profile-card"
              title={t("profile.recentLogin")}
              extra={t("profile.recentLoginCount", { count: RECENT_LOGIN_RECORDS.length })}
            >
              <div className="profile-login">
                {RECENT_LOGIN_RECORDS.map((record) => (
                  <div className="profile-login__item" key={record.time}>
                    <span className="profile-icon">
                      <DesktopOutlined />
                    </span>
                    <div className="profile-login__body">
                      <strong className="profile-login__device">{record.device}</strong>
                      <span className="profile-login__meta">
                        {record.location} / {record.ip}
                      </span>
                    </div>
                    <time className="profile-login__time">{record.time}</time>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              className="profile-card"
              title={t("profile.accountStatus")}
              extra={t("profile.completion", { percent: profileCompletion })}
            >
              <Progress percent={profileCompletion} showInfo={false} />
              <div className="profile-status">
                {infoItems.map((item) => {
                  const done = Boolean(item.value) && item.value !== "-";
                  return (
                    <div
                      className={`profile-status__item${done ? "" : " is-warning"}`}
                      key={item.label}
                    >
                      {done ? <CheckCircleOutlined /> : <WarningOutlined />}
                      <span className="profile-status__label">{item.label}</span>
                      <span className="profile-status__value">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </main>
      </div>

      <Modal
        title={dialogTitles[dialogType]}
        width={520}
        open={dialogOpen}
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => setDialogOpen(false)}
        destroyOnHidden
      >
        {dialogType === "account" && (
          <Form
            form={accountForm}
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 18 }}
            className="pt-2"
          >
            <Form.Item
              name="nickname"
              label={t("system.user.nickname")}
              rules={[{ required: true, message: t("system.user.nicknameRequired") }]}
            >
              <Input placeholder={t("system.user.nicknamePlaceholder")} />
            </Form.Item>
            <Form.Item name="gender" label={t("system.user.gender")}>
              <DictSelect code="gender" />
            </Form.Item>
          </Form>
        )}

        {dialogType === "password" && (
          <Form
            form={passwordForm}
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 18 }}
            className="pt-2"
          >
            <Form.Item
              name="oldPassword"
              label={t("profile.oldPassword")}
              rules={[{ required: true, message: t("profile.oldPasswordRequired") }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label={t("profile.newPassword")}
              rules={[
                { required: true, message: t("profile.newPasswordRequired") },
                { min: 6, message: t("system.user.passwordMin") },
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label={t("profile.confirmPassword")}
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: t("profile.confirmPasswordRequired") },
                ({ getFieldValue }) => ({
                  validator: (_, value: string) =>
                    !value || value === getFieldValue("newPassword")
                      ? Promise.resolve()
                      : Promise.reject(new Error(t("profile.passwordMismatch"))),
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          </Form>
        )}

        {dialogType === "mobile" && (
          <Form form={mobileForm} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} className="pt-2">
            <Form.Item
              name="mobile"
              label={t("system.user.mobile")}
              rules={[
                { required: true, message: t("profile.mobileRequired") },
                { pattern: /^1[3-9]\d{9}$/, message: t("system.user.mobileInvalid") },
              ]}
            >
              <Input maxLength={11} placeholder={t("system.user.mobilePlaceholder")} />
            </Form.Item>
            <Form.Item
              name="code"
              label={t("profile.captcha")}
              rules={[{ required: true, message: t("profile.captchaRequired") }]}
            >
              <Input
                placeholder={t("profile.captchaPlaceholder")}
                suffix={
                  <Button
                    type="link"
                    size="small"
                    disabled={mobileCountdown > 0}
                    onClick={handleSendMobileCode}
                  >
                    {mobileCountdown > 0
                      ? t("profile.resendAfter", { seconds: mobileCountdown })
                      : t("profile.sendCode")}
                  </Button>
                }
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={t("profile.currentPassword")}
              rules={[{ required: true, message: t("profile.currentPasswordRequired") }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>
          </Form>
        )}

        {dialogType === "email" && (
          <Form form={emailForm} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} className="pt-2">
            <Form.Item
              name="email"
              label={t("system.user.email")}
              rules={[
                { required: true, message: t("profile.emailRequired") },
                { type: "email", message: t("system.user.emailInvalid") },
              ]}
            >
              <Input maxLength={50} placeholder={t("system.user.emailPlaceholder")} />
            </Form.Item>
            <Form.Item
              name="code"
              label={t("profile.captcha")}
              rules={[{ required: true, message: t("profile.captchaRequired") }]}
            >
              <Input
                placeholder={t("profile.captchaPlaceholder")}
                suffix={
                  <Button
                    type="link"
                    size="small"
                    disabled={emailCountdown > 0}
                    onClick={handleSendEmailCode}
                  >
                    {emailCountdown > 0
                      ? t("profile.resendAfter", { seconds: emailCountdown })
                      : t("profile.sendCode")}
                  </Button>
                }
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={t("profile.currentPassword")}
              rules={[{ required: true, message: t("profile.currentPasswordRequired") }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>
          </Form>
        )}

        {(dialogType === "unbindMobile" || dialogType === "unbindEmail") && (
          <Form form={unbindForm} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} className="pt-2">
            <Form.Item
              name="password"
              label={t("profile.currentPassword")}
              rules={[{ required: true, message: t("profile.currentPasswordRequired") }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <div className="profile-page__hint">
        <SafetyCertificateOutlined />
        {t("profile.securityHint")}
      </div>
    </div>
  );
}

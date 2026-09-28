import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  App as AntdApp,
  Breadcrumb,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Steps,
  Switch,
  Tag,
  Tooltip,
  TreeSelect,
  Typography,
} from "antd";
import { LinkOutlined, MonitorOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import QRCode from "qrcode";
import { useNavigate } from "react-router-dom";

import type { OptionItem } from "@/api/common";
import FormAPI from "@/api/form";
import type { FormMenuFormData } from "@/api/form";
import MenuAPI from "@/api/system/menu";
import type { MenuItem } from "@/api/system/menu";
import RoleAPI from "@/api/system/role";
import { FormStatus, MenuType } from "@/enums";
import { usePermissionStore } from "@/stores/permission";
import { validateForm } from "@/utils/form";

import type { CatalogNode, PublishMethod } from "./publish/types";

/** 默认挂载目录名称，后端会自动创建 */
const DEFAULT_CATALOG_NAME = "表单中心";

interface PublishDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 表单 ID */
  formId: string;
  /** 表单唯一标识 */
  formKey: string;
  /** 表单名称（菜单名称默认值） */
  formName: string;
  /** 表单状态：已发布走「入口管理」语义，跳过方式选择 */
  status: number;
  /** 是否允许匿名公开访问(0 否 1 是) */
  isPublic?: number;
  /** 关闭 */
  onClose: () => void;
  /** 保存成功后通知列表刷新 */
  onSuccess: () => void;
}

/** 发布 / 入口管理向导：发布方式 → 入口配置 → 完成汇总，已发布的表单直达第二步 */
export default function PublishDialog({
  open,
  formId,
  formKey,
  formName,
  status,
  isPublic,
  onClose,
  onSuccess,
}: PublishDialogProps) {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const reloadRoutes = usePermissionStore((state) => state.reloadRoutes);

  const [form] = Form.useForm<FormMenuFormData>();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  /** 选中的发布方式，可单选可全选 */
  const [selectedMethods, setSelectedMethods] = useState<PublishMethod[]>(["menu"]);
  /** 已生成的菜单配置，未生成过为 null */
  const [menuGenerated, setMenuGenerated] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(false);

  const [catalogTree, setCatalogTree] = useState<CatalogNode[]>([]);
  const [roleOptions, setRoleOptions] = useState<OptionItem[]>([]);
  /** 菜单表单当前值，用于汇总展示 */
  const [menuForm, setMenuForm] = useState<FormMenuFormData>({
    menuName: "",
    parentId: "",
    roleIds: [],
  });

  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  /** 已选角色个数，菜单表单卸载时取不到表单值，用 watch 拿实时值 */
  const watchedRoleIds = Form.useWatch<string[]>("roleIds", form);

  const isPublished = status === FormStatus.PUBLISHED;
  const showMenuConfig = isPublished || selectedMethods.includes("menu");
  const showShareConfig = isPublished || selectedMethods.includes("share");
  const shareVisible = showShareConfig && shareEnabled;

  /** 分享链接：本项目用 HashRouter，走 #/f/formKey */
  const shareUrl = `${window.location.origin}${window.location.pathname}#/f/${formKey}`;

  /** 递归构建目录树，仅目录类型可挂载表单菜单 */
  const buildCatalogTree = useCallback((menus: MenuItem[]): CatalogNode[] => {
    return menus
      .filter((menu) => menu.type === MenuType.CATALOG)
      .map((menu) => ({
        value: String(menu.id ?? ""),
        label: String(menu.name ?? ""),
        routePath: menu.routePath,
        children: menu.children?.length ? buildCatalogTree(menu.children) : undefined,
      }));
  }, []);

  /** 递归查找「表单中心」目录，不存在返回空串（留空由后端自动创建） */
  const findCatalogId = useCallback((nodes: CatalogNode[], name: string): string => {
    for (const node of nodes) {
      if (node.label === name) return node.value;
      if (node.children?.length) {
        const hit = findCatalogId(node.children, name);
        if (hit) return hit;
      }
    }
    return "";
  }, []);

  /** 加载目录树、角色选项与已生成的菜单配置 */
  const loadWizardData = useCallback(async () => {
    const [menuTree, roles, menu] = await Promise.all([
      MenuAPI.getList({}),
      RoleAPI.getOptions(),
      FormAPI.getFormMenu(formId),
    ]);

    const tree = buildCatalogTree(menuTree);
    setCatalogTree(tree);
    setRoleOptions(roles);
    setMenuGenerated(Boolean(menu?.menuId));

    // 未生成过菜单时用表单名与「表单中心」预填
    const initial: FormMenuFormData = {
      menuName: menu?.menuName ?? formName,
      parentId: menu?.parentId ?? findCatalogId(tree, DEFAULT_CATALOG_NAME),
      roleIds: menu?.roleIds ? [...menu.roleIds] : [],
    };
    // 菜单表单只在第②步挂载，值统一由 menuForm 持有并作为 initialValues 传入，
    // 这样在表单未挂载时调用 setFieldsValue 不会触发 antd 的「未连接表单」告警
    setMenuForm(initial);

    // 回显公开开关
    setShareEnabled(isPublic === 1);
  }, [buildCatalogTree, findCatalogId, formId, formName, isPublic]);

  useEffect(() => {
    if (!open) return;

    // 已发布表单的「入口管理」直达入口配置步骤
    setStep(isPublished ? 1 : 0);
    setSelectedMethods(["menu"]);
    loadWizardData();
  }, [isPublished, loadWizardData, open]);

  // 汇总步骤绘制分享二维码，配置此时已定，绘制一次即可
  useEffect(() => {
    if (step !== 2 || !shareVisible || !qrCanvasRef.current) return;
    QRCode.toCanvas(qrCanvasRef.current, shareUrl, { width: 140, margin: 1 });
  }, [shareUrl, shareVisible, step]);

  /** 切换发布方式选中态 */
  const toggleMethod = (method: PublishMethod) => {
    setSelectedMethods((prev) =>
      prev.includes(method) ? prev.filter((item) => item !== method) : [...prev, method]
    );
  };

  /** 保存入口配置：未发布先发布，再生成菜单 / 保存公开开关 */
  const handleSaveEntry = async () => {
    if (showMenuConfig) {
      const menuValues = await validateForm(form);
      if (!menuValues) return;

      setMenuForm((prev) => ({ ...prev, ...menuValues }));
    }

    const values = showMenuConfig ? form.getFieldsValue() : menuForm;

    setSaving(true);
    try {
      if (!isPublished) {
        await FormAPI.publish(formId);
      }
      if (showMenuConfig) {
        await FormAPI.saveFormMenu(formId, {
          menuName: values.menuName,
          parentId: values.parentId,
          roleIds: values.roleIds,
        });
      }
      if (showShareConfig) {
        // isPublic 独立提交，避免只配菜单时把公开状态意外重置；
        // 元数据原样回传满足后端非空校验（已发布态后端不更新元数据）
        await FormAPI.update(formId, {
          formKey,
          formName,
          isPublic: shareEnabled ? 1 : 0,
        });
      }

      setMenuForm((prev) => ({ ...prev, ...values }));
      setStep(2);
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  /** 复制分享链接 */
  const handleCopyLink = () => {
    navigator.clipboard
      ?.writeText(shareUrl)
      .then(() => message.success("链接已复制"))
      .catch(() => message.warning("复制失败，请手动复制"));
  };

  /** 重载动态路由（新建菜单需重新拉路由表）后跳转 */
  const handleGoView = async () => {
    const path = resolveMenuRoutePath();
    if (!path) {
      message.warning("未能解析菜单路径，请刷新页面后从侧边栏进入");
      return;
    }

    await reloadRoutes();
    onClose();
    navigate(path);
  };

  /** 目录名称链（面包屑前缀） */
  const resolveMenuBreadcrumb = (): string[] => {
    const find = (nodes: CatalogNode[], chain: string[]): string[] | undefined => {
      for (const node of nodes) {
        const nextChain = [...chain, node.label];
        if (node.value === menuForm.parentId) return nextChain;
        if (node.children?.length) {
          const hit = find(node.children, nextChain);
          if (hit) return hit;
        }
      }
      return undefined;
    };

    return [...(find(catalogTree, []) ?? []), menuForm.menuName];
  };

  /** 菜单完整访问路径（目录路径链 + 表单标识） */
  const resolveMenuRoutePath = (): string => {
    const find = (nodes: CatalogNode[], basePath: string): string => {
      for (const node of nodes) {
        // 顶级目录的 routePath 以 / 开头，子级为相对段
        const fullPath = node.routePath?.startsWith("/")
          ? node.routePath
          : `${basePath}/${node.routePath ?? ""}`;

        if (node.value === menuForm.parentId) return `${fullPath}/${formKey}`;
        if (node.children?.length) {
          const hit = find(node.children, fullPath);
          if (hit) return hit;
        }
      }
      return "";
    };

    return find(catalogTree, "");
  };

  /** 已授权角色名称 */
  const grantedRoleNames = roleOptions
    .filter((role) => menuForm.roleIds?.includes(String(role.value)))
    .map((role) => role.label);

  /** 汇总步骤副标题 */
  const resultSubtitle =
    showMenuConfig && shareVisible
      ? "员工可从侧边栏进入，也可通过分享链接填写"
      : showMenuConfig
        ? "员工刷新页面后即可从侧边栏进入填写"
        : "通过分享链接或扫码即可填写";

  /** 标签旁带说明的提示图标 */
  const tipIcon = (tip: string) => (
    <Tooltip title={tip}>
      <QuestionCircleOutlined className="publish-tip-icon" />
    </Tooltip>
  );

  /** 分区卡片 */
  const section = (kind: PublishMethod, title: string, sub: string, children: ReactNode) => (
    <section className={`entry-section entry-section--${kind}`}>
      <header className="entry-section__header">
        {kind === "menu" ? <MonitorOutlined /> : <LinkOutlined />}
        <span className="entry-section__title">{title}</span>
        <span className="entry-section__sub">{sub}</span>
      </header>
      {children}
    </section>
  );

  /** 第①步：发布方式 */
  const methodStep = (
    <div className="publish-method">
      {(
        [
          {
            method: "menu" as PublishMethod,
            icon: <MonitorOutlined className="publish-method__icon publish-method__icon--menu" />,
            name: "系统内嵌",
            nameEn: "MENU",
            desc: "员工登录系统从侧边栏进入填写，需配置可见角色",
            done: menuGenerated,
          },
          {
            method: "share" as PublishMethod,
            icon: <LinkOutlined className="publish-method__icon publish-method__icon--share" />,
            name: "对外分享",
            nameEn: "SHARE",
            desc: "微信发链接或扫码即可填写，无需账号",
            done: shareEnabled,
          },
        ] as const
      ).map((item) => (
        <div
          key={item.method}
          className={`method-card${selectedMethods.includes(item.method) ? " method-card--active" : ""}`}
          onClick={() => toggleMethod(item.method)}
        >
          <div className="method-card__header">
            {item.icon}
            <div className="method-card__titles">
              <span className="method-card__name">{item.name}</span>
              <span className="method-card__name-en">{item.nameEn}</span>
            </div>
            {item.done && (
              <Tag color="success">{item.method === "menu" ? "已生成入口" : "已开启"}</Tag>
            )}
          </div>
          <p className="method-card__desc">{item.desc}</p>
        </div>
      ))}

      <div className="publish-method__tip">不确定？两种方式可同时开启</div>
    </div>
  );

  /** 第②步：入口配置 */
  const entryConfigStep = (
    <div className="entry-config">
      {showMenuConfig &&
        section(
          "menu",
          "系统内嵌",
          "登录后侧边栏菜单进入",
          <div className="entry-section__form">
            <Form
              form={form}
              labelCol={{ span: 5 }}
              wrapperCol={{ span: 18 }}
              // 值统一由 menuForm 持有：切步骤重挂载能还原已填内容，汇总也用同一份
              initialValues={menuForm}
              onValuesChange={(_, all) => setMenuForm(all as FormMenuFormData)}
            >
              <Form.Item
                name="menuName"
                label="菜单名称"
                rules={[{ required: true, message: "请输入菜单名称" }]}
              >
                <Input placeholder="侧边栏展示名称" maxLength={50} showCount />
              </Form.Item>

              <Form.Item
                name="parentId"
                label={
                  <Space size={4}>
                    上级菜单
                    {tipIcon("表单入口挂载的目录位置，仅目录类型可选")}
                  </Space>
                }
                rules={[{ required: true, message: "请选择上级菜单" }]}
              >
                <TreeSelect
                  allowClear
                  showSearch
                  treeDefaultExpandAll
                  treeNodeFilterProp="label"
                  placeholder="请选择上级菜单"
                  treeData={catalogTree}
                />
              </Form.Item>

              <Form.Item
                name="roleIds"
                label={
                  <Space size={4}>
                    可见角色
                    {tipIcon("授权后无需再去角色管理分配菜单")}
                  </Space>
                }
                extra={
                  <Space size={8}>
                    <Button
                      type="link"
                      size="small"
                      onClick={() =>
                        form.setFieldValue(
                          "roleIds",
                          roleOptions.map((role) => String(role.value))
                        )
                      }
                    >
                      全选
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => form.setFieldValue("roleIds", [])}
                    >
                      清空
                    </Button>
                    <span className="role-select__count">
                      {watchedRoleIds?.length ?? 0}/{roleOptions.length}
                    </span>
                  </Space>
                }
              >
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  maxTagCount="responsive"
                  placeholder="不选时仅超级管理员可见"
                  options={roleOptions.map((role) => ({
                    label: role.label,
                    value: String(role.value),
                  }))}
                />
              </Form.Item>
            </Form>
          </div>
        )}

      {showShareConfig &&
        section(
          "share",
          "对外分享",
          "匿名链接/二维码进入",
          <div className="entry-section__form">
            <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
              <Form.Item
                label={
                  <Space size={4}>
                    公开访问{tipIcon("开启后可通过链接匿名填写；关闭后已发出去的链接立即失效")}
                  </Space>
                }
              >
                <Switch checked={shareEnabled} onChange={setShareEnabled} />
              </Form.Item>

              {shareEnabled && (
                <Form.Item
                  label={
                    <Space size={4}>
                      分享链接
                      {tipIcon("公开链接无需登录即可提交，请勿在表单中收集敏感信息（如密码）")}
                    </Space>
                  }
                >
                  <Input
                    readOnly
                    value={shareUrl}
                    addonAfter={
                      <Button type="link" size="small" onClick={handleCopyLink}>
                        复制
                      </Button>
                    }
                  />
                </Form.Item>
              )}
            </Form>
          </div>
        )}
    </div>
  );

  /** 第③步：完成汇总 */
  const resultStep = (
    <div className="entry-config">
      {showMenuConfig &&
        section(
          "menu",
          "系统内嵌",
          "已生效",
          <div className="entry-summary">
            <div className="entry-summary__row">
              <span className="entry-summary__label">菜单位置</span>
              <Breadcrumb items={resolveMenuBreadcrumb().map((name) => ({ title: name }))} />
            </div>
            <div className="entry-summary__row">
              <span className="entry-summary__label">可见角色</span>
              {grantedRoleNames.length > 0 ? (
                grantedRoleNames.map((name) => (
                  <Tag key={name} variant="outlined">
                    {name}
                  </Tag>
                ))
              ) : (
                <span className="entry-summary__empty">未授权，仅超级管理员可见</span>
              )}
            </div>
            <Button type="primary" className="entry-summary__action" onClick={handleGoView}>
              前往查看
            </Button>
          </div>
        )}

      {shareVisible &&
        section(
          "share",
          "对外分享",
          "已开启",
          <div className="entry-summary entry-summary--share">
            <canvas ref={qrCanvasRef} className="entry-summary__qrcode" />
            <div className="entry-summary__link">
              <Typography.Link href={shareUrl} target="_blank">
                {shareUrl}
              </Typography.Link>
              <Button size="small" onClick={handleCopyLink}>
                复制链接
              </Button>
            </div>
            <div className="entry-summary__tip">扫码或复制链接分享，微信打开即可填写</div>
          </div>
        )}

      <div className="publish-result__subtitle">{resultSubtitle}</div>
    </div>
  );

  /** 底部按钮：按步骤与入口组合变化 */
  const footer = (
    <Space>
      {step === 0 && (
        <>
          <Button type="primary" disabled={selectedMethods.length === 0} onClick={() => setStep(1)}>
            下一步
          </Button>
          <Button onClick={onClose}>取消</Button>
        </>
      )}
      {step === 1 && (
        <>
          {!isPublished && <Button onClick={() => setStep(0)}>上一步</Button>}
          <Button type="primary" loading={saving} onClick={handleSaveEntry}>
            {isPublished ? "保存配置" : showMenuConfig ? "发布并生成入口" : "发布并开启分享"}
          </Button>
          <Button onClick={onClose}>取消</Button>
        </>
      )}
      {step === 2 && (
        <Button type="primary" onClick={onClose}>
          完成
        </Button>
      )}
    </Space>
  );

  return (
    <Modal
      open={open}
      width={680}
      title={isPublished ? "入口管理" : "发布表单"}
      footer={footer}
      maskClosable={false}
      destroyOnHidden
      onCancel={onClose}
    >
      <Steps
        current={step}
        size="small"
        className="publish-steps"
        items={[{ title: "发布方式" }, { title: "入口配置" }, { title: "发布完成" }]}
      />

      {step === 0 && methodStep}
      {step === 1 && entryConfigStep}
      {step === 2 && resultStep}
    </Modal>
  );
}

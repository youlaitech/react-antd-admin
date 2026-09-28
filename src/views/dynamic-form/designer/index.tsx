import { useCallback, useEffect, useMemo, useState } from "react";
import { App as AntdApp, Button, Input, Modal, Space, Spin, Tag, Tooltip } from "antd";
import { ArrowLeftOutlined, EyeOutlined, RobotOutlined, SaveOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";

import FormAPI from "@/api/form";
import { parseOptions, parseRules } from "@/components/FormRenderer/rule";
import type { FormRenderOptions } from "@/components/FormRenderer/types";
import { findRouteMeta, findRoutePathByComponent } from "@/router/menu";
import { appConfig } from "@/settings";
import { usePermissionStore } from "@/stores/permission";
import Canvas from "./Canvas";
import FieldPanel from "./FieldPanel";
import PropertyPanel from "./PropertyPanel";
import { findRule, installRuleIds, toFormCreateRules, type DesignerRule } from "./rule-model";

/** 表单设计器 */
export default function FormDesigner() {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const menuRoutes = usePermissionStore((state) => state.menuRoutes);

  const formId = searchParams.get("id") ?? "";
  const pageTitle = searchParams.get("title") ?? "表单设计";

  const [rules, setRules] = useState<DesignerRule[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [options, setOptions] = useState<FormRenderOptions>({});
  /** 保存时回传的元数据，满足后端非空校验 */
  const [formMeta, setFormMeta] = useState<{ formKey?: string; formName?: string }>({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  const selectedNode = useMemo(
    () => (selectedId ? findRule(rules, selectedId) : undefined),
    [rules, selectedId]
  );

  // 回显已有规则（无规则即空白画布）
  useEffect(() => {
    if (!formId) {
      message.error("缺少表单ID参数");
      return;
    }

    setLoading(true);
    FormAPI.getFormData(formId)
      .then((data) => {
        setFormMeta({ formKey: data.formKey, formName: data.formName });
        setRules(installRuleIds(parseRules(data.formJson)));

        // 画布「表单名称」面板回显读 option.formName，而设计器产出的键名是
        // formCreateFormName，两者不对称需要转换；未填时用表单定义名称预填
        const parsed = parseOptions(data.optionsJson);
        setOptions({
          ...parsed,
          formName: String(parsed.formName || parsed.formCreateFormName || data.formName || ""),
        });
      })
      .finally(() => setLoading(false));
  }, [formId, message]);

  /** 保存：剥离设计器内部标识后整体提交 */
  const handleSave = async () => {
    if (!formId) return;

    setSaving(true);
    try {
      await FormAPI.update(formId, {
        ...formMeta,
        formJson: JSON.stringify(toFormCreateRules(rules)),
        optionsJson: JSON.stringify(options),
      });
      message.success("保存成功");
    } finally {
      setSaving(false);
    }
  };

  /** AI 生成：直接用结果覆盖画布，确认后再保存 */
  const handleAiGenerate = async () => {
    const description = aiDescription.trim();
    if (!description) {
      message.warning("请输入需求描述");
      return;
    }

    setAiGenerating(true);
    try {
      const formJson = await FormAPI.aiGenerate(description);
      setRules(installRuleIds(parseRules(formJson)));
      setSelectedId(undefined);
      setAiOpen(false);
      message.success("生成完成，请核对后保存");
    } catch {
      message.error("AI 生成失败，请确认已开启 AI 配置或调整描述");
    } finally {
      setAiGenerating(false);
    }
  };

  /** 预览读的是已保存的规则，未保存的改动不体现 */
  const handlePreview = useCallback(() => {
    const path = findRoutePathByComponent(menuRoutes, "dynamic-form/preview");
    if (!path) {
      message.error("路由未注册，请检查菜单配置后重试");
      return;
    }

    navigate({
      pathname: path,
      search: `?${new URLSearchParams({ id: formId, title: pageTitle }).toString()}`,
    });
  }, [formId, menuRoutes, message, navigate, pageTitle]);

  return (
    <div className="form-designer">
      <div className="form-designer__toolbar">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <span className="form-designer__title">
            {findRouteMeta(menuRoutes, window.location.pathname)?.title ?? pageTitle}
          </span>
          {formMeta.formKey && <Tag variant="outlined">{formMeta.formKey}</Tag>}
        </Space>

        <Space>
          <Tooltip title="预览的是已保存的规则">
            <Button icon={<EyeOutlined />} onClick={handlePreview}>
              预览
            </Button>
          </Tooltip>
          {appConfig.aiEnabled && (
            <Button icon={<RobotOutlined />} onClick={() => setAiOpen(true)}>
              AI 生成
            </Button>
          )}
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            保存
          </Button>
        </Space>
      </div>

      <Spin spinning={loading} wrapperClassName="form-designer__spinner">
        <div className="form-designer__body">
          <aside className="form-designer__aside">
            <FieldPanel rules={rules} onChange={setRules} />
          </aside>

          <section className="form-designer__canvas">
            <Canvas
              rules={rules}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={setRules}
            />
          </section>

          <aside className="form-designer__aside form-designer__aside--right">
            <PropertyPanel rules={rules} node={selectedNode} onChange={setRules} />
          </aside>
        </div>
      </Spin>

      <Modal
        open={aiOpen}
        title="AI 生成表单"
        width={560}
        confirmLoading={aiGenerating}
        okText="生成"
        onOk={handleAiGenerate}
        onCancel={() => setAiOpen(false)}
        destroyOnHidden
      >
        <Input.TextArea
          rows={4}
          value={aiDescription}
          placeholder="用一句话描述表单用途，如：员工入职登记，包含姓名、手机号、入职日期、所属部门和附件"
          onChange={(event) => setAiDescription(event.target.value)}
        />
        <div className="form-designer__ai-tip">生成结果会覆盖当前画布，确认后再点保存</div>
      </Modal>
    </div>
  );
}

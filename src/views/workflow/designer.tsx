import { useCallback, useEffect, useRef, useState } from "react";
import { App as AntdApp, Button, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";

import WorkflowAPI from "@/api/workflow";
import { findRoutePathByComponent } from "@/router/menu";
import { usePermissionStore } from "@/stores/permission";
import BpmnDesigner, { type BpmnDesignerHandle } from "./components/BpmnDesigner";

/** 流程设计页 */
export default function WorkflowDesigner() {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const menuRoutes = usePermissionStore((state) => state.menuRoutes);

  const modelId = searchParams.get("modelId") ?? "";
  const title = searchParams.get("title") ?? "流程设计";

  const designerRef = useRef<BpmnDesignerHandle>(null);
  /** 回显的 BPMN XML（新模型为空串，画布空白可自由拖拽） */
  const [xml, setXml] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /** 加载模型 BPMN XML */
  const loadXml = useCallback(async () => {
    setLoading(true);
    try {
      const data = await WorkflowAPI.model.getXml(modelId);
      setXml(data.xml ?? "");
    } finally {
      setLoading(false);
    }
  }, [modelId]);

  useEffect(() => {
    // 无参进入（直接访问隐藏路由或 URL 丢参），设计器无法工作，提示后跳回模型列表
    if (!modelId) {
      message.error("缺少模型ID参数，请从流程设计列表进入");
      const path = findRoutePathByComponent(menuRoutes, "workflow/model");
      if (path) navigate(path, { replace: true });
      return;
    }

    loadXml();
  }, [loadXml, menuRoutes, message, modelId, navigate]);

  /** 保存设计器产出的 BPMN XML */
  const handleSave = useCallback(
    async (savedXml: string) => {
      setSaving(true);
      try {
        await WorkflowAPI.model.saveXml(modelId, savedXml);
        designerRef.current?.markSaved();
        message.success("保存成功");
      } finally {
        setSaving(false);
      }
    },
    [message, modelId]
  );

  /** 返回列表，有未保存修改时二次确认 */
  const handleBack = useCallback(() => {
    if (!designerRef.current?.isDirty()) {
      navigate(-1);
      return;
    }

    modal.confirm({
      title: "提示",
      content: "画布有未保存的修改，离开将丢失，确定返回?",
      okText: "确定离开",
      cancelText: "留在本页",
      onOk: () => navigate(-1),
    });
  }, [modal, navigate]);

  return (
    <div className="workflow-designer">
      <div className="workflow-designer__toolbar">
        <div className="workflow-designer__left">
          <Button shape="circle" icon={<ArrowLeftOutlined />} onClick={handleBack} />
          <span className="workflow-designer__title">{title}</span>
        </div>
        <Button type="primary" loading={saving} onClick={() => designerRef.current?.save()}>
          保存
        </Button>
      </div>

      <Spin spinning={loading} wrapperClassName="workflow-designer__wrapper">
        <BpmnDesigner ref={designerRef} title={title} xml={xml} onSave={handleSave} />
      </Spin>
    </div>
  );
}

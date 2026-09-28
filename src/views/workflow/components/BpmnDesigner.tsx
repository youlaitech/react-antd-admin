import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button, Empty, Input, Select, Space, Tooltip, Typography } from "antd";
import {
  FullscreenOutlined,
  QuestionCircleOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import Modeler from "bpmn-js/lib/Modeler";
import { is } from "bpmn-js/lib/util/ModelUtil";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";

import type { OptionItem } from "@/api/common";
import FormAPI from "@/api/form";
import RoleAPI from "@/api/system/role";
import flowableModdleDescriptor from "./bpmn/flowable-moddle";

/** 画布服务调用子集（diagram-js Canvas，pnpm 严格模式下不可直接引用其类型） */
interface CanvasLike {
  zoom(): number;
  zoom(scale: number | "fit-viewport"): number;
}

/** 建模服务调用子集 */
interface ModelingLike {
  updateProperties(element: unknown, properties: Record<string, unknown>): void;
}

/** moddle 服务调用子集（创建条件表达式等 BPMN 元素） */
interface ModdleLike {
  create(descriptor: string, properties?: Record<string, unknown>): unknown;
}

/** bpmn-js 业务对象：扩展属性通过 get 读取 */
interface BpmnBusinessObject {
  name?: string;
  conditionExpression?: { body?: string };
  get(key: string): unknown;
}

/** 画布元素（Shape / Connection 统称） */
interface BpmnElement {
  id: string;
  businessObject: BpmnBusinessObject;
}

/** 供承载页使用的命令式接口：保存、脏标记查询与清除 */
export interface BpmnDesignerHandle {
  /** 导出当前画布 XML 并回调 onSave */
  save: () => Promise<void>;
  /** 画布是否有未保存的修改 */
  isDirty: () => boolean;
  /** 持久化成功后清除脏标记 */
  markSaved: () => void;
}

interface BpmnDesignerProps {
  /** 设计器标题（工具栏展示） */
  title: string;
  /** BPMN 2.0 XML（导入渲染） */
  xml: string;
  /** 保存回调，抛出当前画布 XML */
  onSave: (xml: string) => void;
  /** 工具栏右侧附加内容（保存按钮等） */
  toolbarExtra?: ReactNode;
}

/** 属性面板的标签行：标题 + 说明气泡 */
function FieldLabel({ label, tip }: { label: string; tip?: string }) {
  return (
    <span className="bpmn-designer__label">
      {label}
      {tip && (
        <Tooltip title={tip}>
          <QuestionCircleOutlined className="bpmn-designer__tip" />
        </Tooltip>
      )}
    </span>
  );
}

/** BPMN 流程设计器 */
const BpmnDesigner = forwardRef<BpmnDesignerHandle, BpmnDesignerProps>(function BpmnDesigner(
  { title, xml, onSave, toolbarExtra },
  ref
) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<Modeler | null>(null);
  /** 脏标记用 ref：只在离开拦截时读取，不需要触发渲染 */
  const dirtyRef = useRef(false);

  const [selected, setSelected] = useState<BpmnElement | null>(null);
  /**
   * bpmn-js 原地修改 businessObject，React 感知不到深值变化
   * 每次改属性后自增一次，强制属性面板重新读取，否则受控控件的选中值不回显
   */
  const [, forceRender] = useReducer((count: number) => count + 1, 0);

  const [roleOptions, setRoleOptions] = useState<OptionItem[]>([]);
  const [formOptions, setFormOptions] = useState<OptionItem[]>([]);

  /** 适应画布（完整展示流程图） */
  const fitViewport = useCallback(() => {
    const canvas = modelerRef.current?.get("canvas") as unknown as CanvasLike | undefined;
    canvas?.zoom("fit-viewport");
  }, []);

  /** 创建建模器并导入 XML */
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const modeler = new Modeler({
      container,
      moddleExtensions: { flowable: flowableModdleDescriptor },
    });
    modelerRef.current = modeler;

    // 选中变化时同步属性面板（多选只取首个）
    modeler.on("selection.changed", (event: { newSelection: BpmnElement[] }) => {
      setSelected(event.newSelection[0] ?? null);
    });
    // 任何建模操作（增删节点/连线/改属性）都会触发命令栈变更
    modeler.on("commandStack.changed", () => {
      dirtyRef.current = true;
    });

    let cancelled = false;
    if (xml) {
      modeler
        .importXML(xml)
        .then(() => {
          if (!cancelled) fitViewport();
        })
        .catch((error) => {
          console.error("BPMN 导入失败:", error);
        })
        .finally(() => {
          // importXML 亦走命令栈，回显不算脏
          if (!cancelled) dirtyRef.current = false;
        });
    }

    return () => {
      cancelled = true;
      modeler.destroy();
      modelerRef.current = null;
    };
  }, [fitViewport, xml]);

  // 候选组与发起表单的数据源
  useEffect(() => {
    RoleAPI.getCodeOptions().then(setRoleOptions);
    FormAPI.getWorkflowOptions().then(setFormOptions);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      save: async () => {
        const modeler = modelerRef.current;
        if (!modeler) return;

        const result = await modeler.saveXML({ format: true });
        onSave(result.xml ?? "");
      },
      isDirty: () => dirtyRef.current,
      markSaved: () => {
        dirtyRef.current = false;
      },
    }),
    [onSave]
  );

  /** 画布缩放，delta 为正放大、负缩小 */
  const handleZoom = (delta: number) => {
    const canvas = modelerRef.current?.get("canvas") as unknown as CanvasLike | undefined;
    if (!canvas) return;
    canvas.zoom(canvas.zoom() + delta);
  };

  /** 更新元素普通属性（name / formKey / assignee / candidateGroups） */
  const updateProperty = (property: string, value: string) => {
    const modeler = modelerRef.current;
    if (!selected || !modeler) return;

    const modeling = modeler.get("modeling") as unknown as ModelingLike;
    // 空值传 undefined 移除属性，避免序列化出空串属性干扰引擎解析
    modeling.updateProperties(selected, {
      [property]: value.trim() === "" ? undefined : value,
    });
    forceRender();
  };

  /** 更新连线条件表达式，空值移除条件走默认分支 */
  const updateCondition = (value: string) => {
    const modeler = modelerRef.current;
    if (!selected || !modeler) return;

    const moddle = modeler.get("moddle") as unknown as ModdleLike;
    const modeling = modeler.get("modeling") as unknown as ModelingLike;
    const conditionExpression = value
      ? moddle.create("bpmn:FormalExpression", { body: value })
      : undefined;

    modeling.updateProperties(selected, { conditionExpression });
    forceRender();
  };

  // 属性面板取值：每次渲染都从 businessObject 现读，配合 forceRender 生效
  const business = selected?.businessObject;
  const isUserTask = selected ? is(selected as never, "bpmn:UserTask") : false;
  const isSequenceFlow = selected ? is(selected as never, "bpmn:SequenceFlow") : false;
  // 仅开始节点可绑定表单：后端只读开始节点 formKey 渲染发起表单
  const isFormBindable = selected ? is(selected as never, "bpmn:StartEvent") : false;

  const selectedName = String(business?.name ?? "");
  const selectedFormKey = String(business?.get("formKey") ?? "");
  const selectedAssignee = String(business?.get("assignee") ?? "");
  const selectedCondition = String(business?.conditionExpression?.body ?? "");
  /** 候选组在 XML 里是逗号串，与多选数组互转，保持引擎兼容 */
  const candidateGroupCodes = String(business?.get("candidateGroups") ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);

  return (
    <div className="bpmn-designer">
      <div className="bpmn-designer__toolbar">
        <span className="bpmn-designer__title">{title}</span>
        <Space>
          <Tooltip title="缩小">
            <Button icon={<ZoomOutOutlined />} onClick={() => handleZoom(-0.1)} />
          </Tooltip>
          <Tooltip title="放大">
            <Button icon={<ZoomInOutlined />} onClick={() => handleZoom(0.1)} />
          </Tooltip>
          <Tooltip title="适应画布">
            <Button icon={<FullscreenOutlined />} onClick={fitViewport} />
          </Tooltip>
          {toolbarExtra}
        </Space>
      </div>

      <div className="bpmn-designer__body">
        <div ref={canvasRef} className="bpmn-designer__canvas" />

        <aside className="bpmn-designer__panel">
          {selected ? (
            <div className="bpmn-designer__form">
              <div className="bpmn-prop">
                <span className="bpmn-prop__label">节点ID</span>
                <div className="bpmn-prop__control">
                  <Input value={selected.id} disabled />
                </div>
              </div>

              <div className="bpmn-prop">
                <span className="bpmn-prop__label">节点名称</span>
                <div className="bpmn-prop__control">
                  <Input
                    value={selectedName}
                    placeholder="如：部门主管审批"
                    onChange={(event) => updateProperty("name", event.target.value)}
                  />
                </div>
              </div>

              {isFormBindable && (
                <div className="bpmn-prop">
                  <span className="bpmn-prop__label">
                    <FieldLabel
                      label="发起表单"
                      tip="发起人启动流程时填写的表单，审批环节展示的也是这份表单数据"
                    />
                  </span>
                  <div className="bpmn-prop__control">
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      className="w-full"
                      value={selectedFormKey || undefined}
                      placeholder="选择已发布的工作流表单"
                      options={formOptions.map((item) => ({
                        label: item.label,
                        value: String(item.value),
                      }))}
                      onChange={(value) => updateProperty("formKey", String(value ?? ""))}
                    />
                  </div>
                </div>
              )}

              {isUserTask && (
                <>
                  <div className="bpmn-prop">
                    <span className="bpmn-prop__label">
                      <FieldLabel
                        label="办理人"
                        tip="单个用户名（登录账号）或 ${initiator}（发起人本人）；任务直接进入其待办"
                      />
                    </span>
                    <div className="bpmn-prop__control">
                      <Input
                        value={selectedAssignee}
                        placeholder="如 admin 或 ${initiator}"
                        onChange={(event) => updateProperty("assignee", event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bpmn-prop">
                    <span className="bpmn-prop__label">
                      <FieldLabel
                        label="候选组"
                        tip="选择角色，可多选；角色成员均可在待办中认领办理"
                      />
                    </span>
                    <div className="bpmn-prop__control">
                      <Select
                        mode="multiple"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        maxTagCount="responsive"
                        className="w-full"
                        value={candidateGroupCodes}
                        placeholder="选择可办理该节点的角色"
                        options={roleOptions.map((item) => ({
                          label: item.label,
                          value: String(item.value),
                        }))}
                        onChange={(codes: string[]) =>
                          updateProperty("candidateGroups", codes.join(","))
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {isSequenceFlow && (
                <div className="bpmn-prop">
                  <span className="bpmn-prop__label">
                    <FieldLabel
                      label="条件表达式"
                      tip="留空走默认分支；表达式引用表单字段或流程变量，如 ${days > 3}"
                    />
                  </span>
                  <div className="bpmn-prop__control">
                    <Input.TextArea
                      rows={2}
                      value={selectedCondition}
                      placeholder="${days > 3}"
                      onChange={(event) => updateCondition(event.target.value)}
                    />
                  </div>
                </div>
              )}

              <Typography.Text type="secondary" className="bpmn-designer__hint">
                拖拽左侧图形元素到画布、点选节点连线，改动通过工具栏的保存生效
              </Typography.Text>
            </div>
          ) : (
            <Empty
              className="bpmn-designer__empty"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="点击画布节点配置属性"
            />
          )}
        </aside>
      </div>
    </div>
  );
});

export default BpmnDesigner;

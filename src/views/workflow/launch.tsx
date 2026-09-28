import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Empty, Form, Input, Result, Select, Typography } from "antd";
import { useNavigate } from "react-router-dom";

import FormAPI from "@/api/form";
import WorkflowAPI from "@/api/workflow";
import type { ProcessStageItem, StartableProcessItem } from "@/api/workflow";
import { useFormRenderer } from "@/views/dynamic-form/composables/useFormRenderer";
import { findRoutePathByComponent } from "@/router/menu";
import { usePermissionStore } from "@/stores/permission";
import { useUserStore } from "@/stores/user";
import FormRenderer from "@/components/FormRenderer";
import ProcessStages from "./components/ProcessStages";

/** 数值补零为两位 */
const pad = (value: number) => String(value).padStart(2, "0");

/** 发起流程页 */
export default function WorkflowLaunch() {
  const navigate = useNavigate();
  const menuRoutes = usePermissionStore((state) => state.menuRoutes);
  const userInfo = useUserStore((state) => state.userInfo);

  /** 可发起流程列表 */
  const [processList, setProcessList] = useState<StartableProcessItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  /** 审批流程走向预览 */
  const [stages, setStages] = useState<ProcessStageItem[]>([]);
  const [starting, setStarting] = useState(false);
  /** 演示引导提示条（关闭后本次会话不再显示） */
  const [demoTipVisible, setDemoTipVisible] = useState(true);

  /** 流程实例名称：默认按「流程-姓名-时间」拼接，可手动改以区分同流程的多次发起 */
  const [processName, setProcessName] = useState("");
  const [autoNameValue, setAutoNameValue] = useState("");

  const selectedProcess = useMemo(
    () => processList.find((process) => process.id === selectedId),
    [processList, selectedId]
  );

  /** 发起表单渲染状态（复用动态表单渲染管线，保证与填写页一致） */
  const { rules, options, loading, submitted, setSubmitted, load, refill } = useFormRenderer(
    useCallback(() => {
      // 未选流程时不能让标识落到空串：会请求 /forms//render，被后端当非法路径拒掉
      const formKey = selectedProcess?.formKey;
      return formKey ? FormAPI.getRender(formKey) : Promise.resolve(null);
    }, [selectedProcess?.formKey])
  );

  useEffect(() => {
    WorkflowAPI.definition.listStartable().then(setProcessList);
  }, []);

  /** 生成默认流程名称：流程名-昵称-MM 月 DD 日 */
  const buildAutoName = (process?: StartableProcessItem) => {
    if (!process) return "";

    const nickname = userInfo?.nickname || userInfo?.username || "";
    const now = new Date();
    return `${process.name}-${nickname}-${pad(now.getMonth() + 1)}月${pad(now.getDate())}日`;
  };

  /** 切换流程 */
  const handleProcessChange = async (id: string) => {
    setSelectedId(id);
    setSubmitted(false);

    const process = processList.find((item) => item.id === id);
    const auto = buildAutoName(process);
    setAutoNameValue(auto);
    setProcessName(auto);

    if (process?.formKey) load();
    setStages(id ? await WorkflowAPI.definition.listStages(id) : []);
  };

  /** 跳转审批中心「我发起的」查看进度 */
  const goMyTasks = useCallback(() => {
    const path = findRoutePathByComponent(menuRoutes, "workflow/task");
    if (!path) return;
    navigate({ pathname: path, search: "?tab=mine" });
  }, [menuRoutes, navigate]);

  /** 提交发起表单并发起流程（表单数据即流程变量，驱动网关条件） */
  const handleSubmit = async (data: Record<string, unknown>) => {
    await WorkflowAPI.instance.start({
      processDefinitionId: selectedId,
      name: processName,
      formData: data,
    });
    setSubmitted(true);
  };

  /** 未绑定表单流程的直接发起 */
  const handleDirectStart = async () => {
    setStarting(true);
    try {
      await WorkflowAPI.instance.start({ processDefinitionId: selectedId, name: processName });
      goMyTasks();
    } finally {
      setStarting(false);
    }
  };

  /** 手动改名后展示「恢复自动命名」入口 */
  const autoNameDirty = processName !== autoNameValue;

  return (
    <div className="launch-container">
      <Card
        variant="borderless"
        className="launch-card"
        title={
          <div className="launch-card__header">
            <span className="launch-card__title">发起流程</span>
            <Select
              className="launch-card__select"
              placeholder="请选择要发起的流程"
              value={selectedId || undefined}
              onChange={handleProcessChange}
              options={processList.map((process) => ({
                label: `${process.name}（v${process.version}）`,
                value: process.id,
              }))}
            />
          </div>
        }
      >
        {demoTipVisible && (
          <Alert
            className="launch-card__demo-tip"
            type="info"
            showIcon
            closable
            title="工作流演示说明"
            description="用 employee 发起后，依次切换各环节审批人（dept_manager、manager、finance、clerk）在「审批中心」的待办页签中审批，即可走完流程。数据乱了可在「流程设计」页重置。"
            onClose={() => setDemoTipVisible(false)}
          />
        )}

        {selectedProcess && (
          <Form layout="vertical" className="launch-card__name-form">
            <Form.Item label="流程名称">
              <Input
                allowClear
                value={processName}
                placeholder="例：报销审批-张三-09月07日"
                onChange={(event) => setProcessName(event.target.value)}
              />
              {autoNameDirty && (
                <div className="launch-card__name-reset">
                  <Typography.Link onClick={() => setProcessName(autoNameValue)}>
                    恢复自动命名
                  </Typography.Link>
                </div>
              )}
            </Form.Item>
          </Form>
        )}

        {/* 发起前即可见各环节的审批角色与办理人（全部待开始） */}
        {stages.length > 0 && (
          <ProcessStages className="launch-card__stages" stages={stages} active={-1} />
        )}

        {selectedProcess?.formKey ? (
          <FormRenderer
            title={selectedProcess.name}
            rules={rules}
            options={options}
            loading={loading}
            submitted={submitted}
            onFinish={handleSubmit}
            successSlot={
              <Result
                status="success"
                title="流程发起成功"
                extra={
                  <>
                    <Button type="primary" onClick={refill}>
                      继续发起
                    </Button>
                    <Button onClick={goMyTasks}>查看流程进度</Button>
                  </>
                }
              />
            }
          />
        ) : selectedProcess ? (
          <Empty description="该流程未绑定表单，确认后直接发起">
            <Button type="primary" loading={starting} onClick={handleDirectStart}>
              发起流程
            </Button>
          </Empty>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择要发起的流程" />
        )}
      </Card>
    </div>
  );
}

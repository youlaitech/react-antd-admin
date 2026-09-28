import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  App as AntdApp,
  Badge,
  Button,
  Descriptions,
  Input,
  Modal,
  Select,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import { FullscreenExitOutlined, FullscreenOutlined, RobotOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";

import WorkflowAPI from "@/api/workflow";
import type {
  DoneTaskItem,
  InstanceStatus,
  RejectTargetItem,
  TaskDetailData,
  TodoTaskItem,
  WorkflowInstanceItem,
  WorkflowInstanceQueryParams,
  WorkflowTaskQueryParams,
} from "@/api/workflow";
import { CrudTable, useCrudPage } from "@/components/Crud";
import type { CrudTableConfig } from "@/components/Crud";
import { useFullscreen } from "@/hooks/useFullscreen";
import { appConfig } from "@/settings";
import ApprovalTimeline from "../components/ApprovalTimeline";
import FormDetail from "../components/FormDetail";
import InstanceDetailDrawer from "../components/InstanceDetailDrawer";
import ProcessStages from "../components/ProcessStages";

/** 实例状态展示映射 */
const STATUS_OPTIONS: Record<InstanceStatus, { label: string; color: string }> = {
  running: { label: "运行中", color: "processing" },
  finished: { label: "已完成", color: "success" },
  terminated: { label: "已终止", color: "error" },
};

/** 关键字搜索框配置，三个页签共用 */
const keywordSearch = {
  formItems: [
    {
      type: "input" as const,
      label: "关键字",
      prop: "keywords",
      attrs: { placeholder: "任务名称" },
    },
  ],
};

/** 全屏按钮，三个页签共用 */
function FullscreenButton() {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
      <Button
        icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
        onClick={toggleFullscreen}
      />
    </Tooltip>
  );
}

/** 审批办理弹窗 */
function ApproveModal({
  taskId,
  onClose,
  onSuccess,
}: {
  taskId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { message } = AntdApp.useApp();

  const [detail, setDetail] = useState<TaskDetailData>();
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /** AI 摘要与生成状态 */
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  /** 驳回模式 */
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectTargets, setRejectTargets] = useState<RejectTargetItem[]>([]);
  const [rejectTargetId, setRejectTargetId] = useState("");

  useEffect(() => {
    setLoading(true);
    WorkflowAPI.task
      .getDetail(taskId)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [taskId]);

  /** 当前任务在流程走向中的位置：节点 ID 精确匹配，未匹配时不高亮 */
  const currentStageIndex = useMemo(() => {
    if (!detail?.stages?.length || !detail.taskDefinitionKey) return 0;
    const index = detail.stages.findIndex((stage) => stage.nodeId === detail.taskDefinitionKey);
    return index < 0 ? 0 : index;
  }, [detail]);

  /** 生成当前任务的 AI 摘要 */
  const handleAiSummary = async () => {
    setAiLoading(true);
    try {
      setAiSummary(await WorkflowAPI.task.aiSummary(taskId));
    } catch {
      message.error("AI 摘要生成失败，请确认已开启 AI 配置");
    } finally {
      setAiLoading(false);
    }
  };

  /** 切入驳回模式并加载可驳回的历史节点 */
  const handleRejectClick = async () => {
    const targets = await WorkflowAPI.task.listRejectTargets(taskId);
    if (targets.length === 0) {
      message.warning("当前任务无可驳回的历史节点");
      return;
    }

    setRejectTargets(targets);
    setRejectTargetId(targets[0].activityId);
    setRejectMode(true);
  };

  /** 退出驳回模式 */
  const closeRejectMode = () => {
    setRejectMode(false);
    setRejectTargets([]);
    setRejectTargetId("");
  };

  /** 审批通过 */
  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await WorkflowAPI.task.complete(taskId, { comment });
      message.success("审批通过");
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  /** 驳回到指定历史节点 */
  const handleReject = async () => {
    setSubmitting(true);
    try {
      await WorkflowAPI.task.reject(taskId, { targetActivityId: rejectTargetId, comment });
      message.success("驳回成功");
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      width={760}
      open
      title={detail ? `【${detail.taskName}】审批办理` : "审批办理"}
      destroyOnHidden
      footer={
        rejectMode ? (
          <Space>
            <Button type="primary" loading={submitting} onClick={handleReject}>
              确认驳回
            </Button>
            <Button onClick={closeRejectMode}>返回</Button>
          </Space>
        ) : (
          <Space>
            <Button type="primary" loading={submitting} disabled={loading} onClick={handleComplete}>
              通过
            </Button>
            <Button danger disabled={loading} onClick={handleRejectClick}>
              驳回
            </Button>
            <Button onClick={onClose}>取消</Button>
          </Space>
        )
      }
      onCancel={onClose}
    >
      {loading || !detail ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <>
          <Descriptions
            column={2}
            bordered
            size="small"
            items={[
              { key: "process", label: "流程名称", children: detail.processName },
              { key: "task", label: "当前任务", children: detail.taskName },
            ]}
          />

          {/* AI 摘要：按需生成，未开启 AI 时入口不显示；生成失败不影响审批 */}
          {appConfig.aiEnabled && (
            <div className="todo-approve__ai">
              <div className="todo-approve__ai-header">
                <span>AI 摘要</span>
                <Button type="link" loading={aiLoading} onClick={handleAiSummary}>
                  <RobotOutlined />
                  {aiSummary ? "重新生成" : "生成摘要"}
                </Button>
              </div>
              {aiSummary && <Alert type="info" showIcon title={aiSummary} />}
            </div>
          )}

          <Tabs
            className="todo-approve__tabs"
            items={[
              {
                key: "form",
                label: "申请信息",
                children: detail.formJson ? (
                  <FormDetail
                    formJson={detail.formJson}
                    optionsJson={detail.optionsJson}
                    dataJson={detail.dataJson}
                  />
                ) : (
                  <p className="workflow-empty">该流程未绑定表单</p>
                ),
              },
              {
                key: "flow",
                label: "流程走向",
                children: detail.stages?.length ? (
                  <ProcessStages stages={detail.stages} active={currentStageIndex} />
                ) : (
                  <p className="workflow-empty">无可展示的流程走向</p>
                ),
              },
              {
                key: "history",
                label: "审批记录",
                children: <ApprovalTimeline history={detail.history} />,
              },
            ]}
          />

          <Space direction="vertical" className="w-full" size={8}>
            <Input.TextArea
              rows={2}
              value={comment}
              placeholder="请输入审批意见"
              onChange={(event) => setComment(event.target.value)}
            />
            {rejectMode && (
              <Select
                className="w-full"
                value={rejectTargetId}
                placeholder="请选择驳回到的节点"
                options={rejectTargets.map((target) => ({
                  label: target.activityName,
                  value: target.activityId,
                }))}
                onChange={setRejectTargetId}
              />
            )}
          </Space>
        </>
      )}
    </Modal>
  );
}

/** 待办任务页签 */
function TodoTab({ onTotalChange }: { onTotalChange: (total: number) => void }) {
  const [approveTaskId, setApproveTaskId] = useState<string>();

  const tableConfig: CrudTableConfig<TodoTaskItem, WorkflowTaskQueryParams> = useMemo(
    () => ({
      permPrefix: "workflow:task",
      pk: "id",
      toolbar: [],
      defaultToolbar: ["refresh"],
      cols: [
        // 流程名称为主列：各流程首节点名相近（部门主管审批），流程名称才是区分项
        { label: "流程名称", prop: "processName", width: 160 },
        { label: "任务名称", prop: "name", width: 160 },
        { label: "流程实例ID", prop: "processInstanceId", width: 260 },
        { label: "创建时间", prop: "createTime", width: 170, align: "center" },
        {
          label: "操作",
          width: 100,
          align: "center",
          templet: "tool",
          operat: [{ name: "approve", text: "办理" }],
        },
      ],
      indexAction: (params) => WorkflowAPI.task.getTodoPage(params),
    }),
    []
  );

  const crud = useCrudPage<TodoTaskItem, WorkflowTaskQueryParams>({
    table: tableConfig,
    search: keywordSearch,
    initialParams: {},
    onOperate: (name, row) => {
      if (name === "approve") setApproveTaskId(row.id);
    },
  });

  useEffect(() => {
    onTotalChange(crud.total);
  }, [crud.total, onTotalChange]);

  return (
    <>
      <CrudTable<TodoTaskItem, WorkflowTaskQueryParams>
        {...crud.tableProps}
        toolbarExtraRight={<FullscreenButton />}
      />
      {approveTaskId && (
        <ApproveModal
          taskId={approveTaskId}
          onClose={() => setApproveTaskId(undefined)}
          onSuccess={crud.reload}
        />
      )}
    </>
  );
}

/**
 * 已办任务页签
 */
function DoneTab() {
  const [detailInstanceId, setDetailInstanceId] = useState<string>();

  const tableConfig: CrudTableConfig<DoneTaskItem, WorkflowTaskQueryParams> = useMemo(
    () => ({
      permPrefix: "workflow:task",
      pk: "id",
      toolbar: [],
      defaultToolbar: ["refresh"],
      cols: [
        { label: "流程名称", prop: "processName", width: 160 },
        { label: "任务名称", prop: "name", width: 160 },
        { label: "流程实例ID", prop: "processInstanceId", width: 260 },
        { label: "办理时间", prop: "endTime", width: 170, align: "center" },
        { label: "处理意见", prop: "comment", width: 200 },
        {
          label: "操作",
          width: 100,
          align: "center",
          templet: "tool",
          operat: [{ name: "detail", text: "详情" }],
        },
      ],
      indexAction: (params) => WorkflowAPI.task.getDonePage(params),
    }),
    []
  );

  const crud = useCrudPage<DoneTaskItem, WorkflowTaskQueryParams>({
    table: tableConfig,
    search: keywordSearch,
    initialParams: {},
    onOperate: (name, row) => {
      if (name === "detail") setDetailInstanceId(row.processInstanceId);
    },
  });

  return (
    <>
      <CrudTable<DoneTaskItem, WorkflowTaskQueryParams>
        {...crud.tableProps}
        toolbarExtraRight={<FullscreenButton />}
      />
      <InstanceDetailDrawer
        instanceId={detailInstanceId}
        onClose={() => setDetailInstanceId(undefined)}
      />
    </>
  );
}

/**
 * 我发起的页签
 */
function MineTab() {
  const [detailInstanceId, setDetailInstanceId] = useState<string>();

  const tableConfig: CrudTableConfig<WorkflowInstanceItem, WorkflowInstanceQueryParams> = useMemo(
    () => ({
      permPrefix: "workflow:instance",
      pk: "id",
      toolbar: [],
      defaultToolbar: ["refresh"],
      cols: [
        { label: "流程名称", prop: "processName", width: 160 },
        {
          label: "状态",
          prop: "status",
          width: 100,
          align: "center",
          render: (row) => (
            <Tag color={STATUS_OPTIONS[row.status]?.color}>{STATUS_OPTIONS[row.status]?.label}</Tag>
          ),
        },
        { label: "发起时间", prop: "startTime", width: 170, align: "center" },
        { label: "结束时间", prop: "endTime", width: 170, align: "center" },
        { label: "终止原因", prop: "deleteReason", width: 160 },
        {
          label: "操作",
          width: 100,
          align: "center",
          templet: "tool",
          operat: [{ name: "detail", text: "详情" }],
        },
      ],
      indexAction: (params) => WorkflowAPI.instance.getPage(params),
    }),
    []
  );

  const crud = useCrudPage<WorkflowInstanceItem, WorkflowInstanceQueryParams>({
    table: tableConfig,
    search: {
      formItems: [
        {
          type: "input",
          label: "关键字",
          prop: "keywords",
          attrs: { placeholder: "流程名称" },
        },
      ],
    },
    initialParams: {},
    onOperate: (name, row) => {
      if (name === "detail") setDetailInstanceId(row.id);
    },
  });

  return (
    <>
      <CrudTable<WorkflowInstanceItem, WorkflowInstanceQueryParams>
        {...crud.tableProps}
        toolbarExtraRight={<FullscreenButton />}
      />
      <InstanceDetailDrawer
        instanceId={detailInstanceId}
        onClose={() => setDetailInstanceId(undefined)}
      />
    </>
  );
}

/** 审批中心 */
export default function WorkflowTask() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") ?? "todo");
  const [todoTotal, setTodoTotal] = useState(0);

  return (
    <div className="page-container">
      <Tabs
        className="workflow-task"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "todo",
            label: (
              <span className="workflow-task__label">
                待办
                {todoTotal > 0 && <Badge count={todoTotal} overflowCount={99} />}
              </span>
            ),
            children: <TodoTab onTotalChange={setTodoTotal} />,
          },
          { key: "done", label: "已办", children: <DoneTab /> },
          { key: "mine", label: "我发起的", children: <MineTab /> },
        ]}
      />
    </div>
  );
}

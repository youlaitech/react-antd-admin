import { defineMock } from "./base";

/** 工作流 mock（内存态）：模型、定义、实例、任务四组接口 */

/** 表单规则（与 src/components/FormRenderer/types.ts 的 FormRule 同构） */
interface FormRule {
  type?: string;
  field?: string;
  title?: string;
  value?: unknown;
  props?: Record<string, unknown>;
  options?: Array<{ label: string; value: string | number }>;
  validate?: Array<Record<string, unknown>>;
}

/** 流程模型行 */
interface ModelRow {
  id: string;
  name: string;
  key: string;
  description?: string;
  version: number;
  definitionId?: string;
  publishedVersion?: number;
  suspended?: boolean;
  deploymentTime?: string;
  createTime: string;
  updateTime?: string;
  /** 设计器保存的 BPMN XML，未保存过时为空 */
  xml?: string;
}

/** 流程实例行 */
interface InstanceRow {
  id: string;
  processDefinitionKey: string;
  processName: string;
  businessKey?: string;
  formKey?: string;
  status: "running" | "finished" | "terminated";
  deleteReason?: string;
  startTime: string;
  endTime?: string;
  startUser?: string;
  /** 已走完的节点 */
  executedActivityIds: string[];
  /** 当前进行中的节点 */
  activeActivityIds: string[];
  /** 审批记录 */
  history: Array<Record<string, unknown>>;
}

/** 待办任务行 */
interface TodoRow {
  id: string;
  name: string;
  processInstanceId: string;
  processName: string;
  businessKey?: string;
  formKey?: string;
  taskDefinitionKey?: string;
  createTime: string;
}

/** 已办任务行 */
interface DoneRow {
  id: string;
  name: string;
  processInstanceId: string;
  processName: string;
  endTime?: string;
  comment?: string;
}

/** 请假审批流程 BPMN XML（与后端 leave.bpmn20.xml 一致） */
const LEAVE_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  xmlns:flowable="http://flowable.org/bpmn"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  id="Definitions_leave" targetNamespace="http://youlai.tech/workflow">
  <bpmn:process id="leave" name="请假审批" isExecutable="true">
    <bpmn:startEvent id="startEvent" name="开始" flowable:formKey="leave_apply">
      <bpmn:outgoing>flow1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:userTask id="leaderApprove" name="部门主管审批" flowable:candidateGroups="DEPT_MANAGER">
      <bpmn:incoming>flow1</bpmn:incoming>
      <bpmn:outgoing>flow2</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:exclusiveGateway id="daysGateway" name="请假天数？" default="flow4">
      <bpmn:incoming>flow2</bpmn:incoming>
      <bpmn:outgoing>flow3</bpmn:outgoing>
      <bpmn:outgoing>flow4</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:userTask id="managerApprove" name="总经理审批" flowable:candidateGroups="GENERAL_MANAGER">
      <bpmn:incoming>flow3</bpmn:incoming>
      <bpmn:outgoing>flow5</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:endEvent id="endEvent" name="结束">
      <bpmn:incoming>flow4</bpmn:incoming>
      <bpmn:incoming>flow5</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="flow1" sourceRef="startEvent" targetRef="leaderApprove"/>
    <bpmn:sequenceFlow id="flow2" sourceRef="leaderApprove" targetRef="daysGateway"/>
    <bpmn:sequenceFlow id="flow3" name="超过3天" sourceRef="daysGateway" targetRef="managerApprove">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">\${days > 3}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="flow4" name="3天以内" sourceRef="daysGateway" targetRef="endEvent"/>
    <bpmn:sequenceFlow id="flow5" sourceRef="managerApprove" targetRef="endEvent"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_leave">
    <bpmndi:BPMNPlane id="BPMNPlane_leave" bpmnElement="leave">
      <bpmndi:BPMNShape id="startEvent_di" bpmnElement="startEvent">
        <dc:Bounds x="152" y="102" width="36" height="36"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="leaderApprove_di" bpmnElement="leaderApprove">
        <dc:Bounds x="240" y="80" width="100" height="80"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="daysGateway_di" bpmnElement="daysGateway">
        <dc:Bounds x="395" y="95" width="50" height="50"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="managerApprove_di" bpmnElement="managerApprove">
        <dc:Bounds x="510" y="80" width="100" height="80"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="endEvent_di" bpmnElement="endEvent">
        <dc:Bounds x="662" y="102" width="36" height="36"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="flow1_di" bpmnElement="flow1">
        <di:waypoint x="188" y="120"/>
        <di:waypoint x="240" y="120"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="flow2_di" bpmnElement="flow2">
        <di:waypoint x="340" y="120"/>
        <di:waypoint x="395" y="120"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="flow3_di" bpmnElement="flow3">
        <di:waypoint x="445" y="120"/>
        <di:waypoint x="510" y="120"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="flow4_di" bpmnElement="flow4">
        <di:waypoint x="420" y="145"/>
        <di:waypoint x="420" y="200"/>
        <di:waypoint x="680" y="200"/>
        <di:waypoint x="680" y="138"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="flow5_di" bpmnElement="flow5">
        <di:waypoint x="610" y="120"/>
        <di:waypoint x="662" y="120"/>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

/** 生成新建模型的空白 BPMN */
function blankBpmnXml(key: string, name: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_${key}" targetNamespace="http://youlai.tech/workflow">
  <bpmn:process id="${key}" name="${name}" isExecutable="true">
    <bpmn:startEvent id="startEvent" name="开始">
      <bpmn:outgoing>flow1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:endEvent id="endEvent" name="结束">
      <bpmn:incoming>flow1</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="flow1" sourceRef="startEvent" targetRef="endEvent"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_${key}">
    <bpmndi:BPMNPlane id="BPMNPlane_${key}" bpmnElement="${key}">
      <bpmndi:BPMNShape id="startEvent_di" bpmnElement="startEvent">
        <dc:Bounds x="152" y="102" width="36" height="36"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="endEvent_di" bpmnElement="endEvent">
        <dc:Bounds x="300" y="102" width="36" height="36"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="flow1_di" bpmnElement="flow1">
        <di:waypoint x="188" y="120"/>
        <di:waypoint x="300" y="120"/>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

/** 请假单规则：与 form.mock.ts 的 leave_apply 定义一致，用于发起表单快照回显 */
const LEAVE_FORM_RULES: FormRule[] = [
  {
    type: "select",
    field: "leaveType",
    title: "请假类型",
    value: "annual",
    options: [
      { label: "年假", value: "annual" },
      { label: "事假", value: "personal" },
      { label: "病假", value: "sick" },
    ],
  },
  {
    type: "datePicker",
    field: "startDate",
    title: "开始日期",
    props: { style: { width: "100%" } },
  },
  { type: "datePicker", field: "endDate", title: "结束日期", props: { style: { width: "100%" } } },
  { type: "inputNumber", field: "days", title: "请假天数", value: 1 },
  { type: "input", field: "reason", title: "请假事由" },
];

/** 流程走向：请假审批的两个审批环节 */
const LEAVE_STAGES = [
  {
    nodeId: "leaderApprove",
    nodeName: "部门主管审批",
    roleNames: ["部门主管"],
    userNames: ["admin", "zhangsan"],
    initiator: false,
  },
  {
    nodeId: "managerApprove",
    nodeName: "总经理审批",
    roleNames: ["总经理"],
    userNames: ["boss"],
    initiator: false,
  },
];

/** 流程模型（内存态） */
const models: ModelRow[] = [
  {
    id: "1",
    name: "请假审批",
    key: "leave",
    description: "按请假天数分流：3 天以内主管审批即可",
    version: 1,
    definitionId: "leave:1:1001",
    publishedVersion: 1,
    suspended: false,
    deploymentTime: "2026-09-23 11:20:00",
    createTime: "2026-09-23 11:00:00",
    updateTime: "2026-09-23 11:20:00",
    xml: LEAVE_BPMN_XML,
  },
  {
    id: "2",
    name: "费用报销",
    key: "expense",
    description: "差旅与办公费用报销（未发布）",
    version: 1,
    createTime: "2026-09-25 09:40:00",
    updateTime: "2026-09-25 09:40:00",
  },
];

/** 流程实例（内存态） */
const instances: InstanceRow[] = [
  {
    id: "1",
    processDefinitionKey: "leave",
    processName: "请假审批",
    businessKey: "4",
    formKey: "leave_apply",
    status: "running",
    startTime: "2026-09-26 17:10:00",
    startUser: "admin",
    executedActivityIds: ["startEvent"],
    activeActivityIds: ["leaderApprove"],
    history: [
      {
        activityId: "startEvent",
        activityName: "开始",
        assignee: "admin",
        startTime: "2026-09-26 17:10:00",
        endTime: "2026-09-26 17:10:00",
      },
    ],
  },
  {
    id: "2",
    processDefinitionKey: "leave",
    processName: "请假审批",
    businessKey: "3",
    formKey: "leave_apply",
    status: "finished",
    startTime: "2026-09-22 09:05:00",
    endTime: "2026-09-22 15:30:00",
    startUser: "admin",
    executedActivityIds: ["startEvent", "leaderApprove", "daysGateway", "endEvent"],
    activeActivityIds: [],
    history: [
      {
        activityId: "startEvent",
        activityName: "开始",
        assignee: "admin",
        startTime: "2026-09-22 09:05:00",
        endTime: "2026-09-22 09:05:00",
      },
      {
        activityId: "leaderApprove",
        activityName: "部门主管审批",
        assignee: "admin",
        comment: "同意，3 天以内",
        startTime: "2026-09-22 09:06:00",
        endTime: "2026-09-22 15:30:00",
      },
    ],
  },
  {
    id: "3",
    processDefinitionKey: "leave",
    processName: "请假审批",
    status: "terminated",
    deleteReason: "重复提交，已撤销",
    startTime: "2026-09-20 14:00:00",
    endTime: "2026-09-20 14:20:00",
    startUser: "admin",
    executedActivityIds: ["startEvent", "leaderApprove"],
    activeActivityIds: [],
    history: [
      {
        activityId: "startEvent",
        activityName: "开始",
        assignee: "admin",
        startTime: "2026-09-20 14:00:00",
        endTime: "2026-09-20 14:00:00",
      },
    ],
  },
];

/** 待办任务（内存态） */
const todoTasks: TodoRow[] = [
  {
    id: "101",
    name: "部门主管审批",
    processInstanceId: "1",
    processName: "请假审批",
    businessKey: "4",
    formKey: "leave_apply",
    taskDefinitionKey: "leaderApprove",
    createTime: "2026-09-26 17:10:00",
  },
];

/** 已办任务（内存态） */
const doneTasks: DoneRow[] = [
  {
    id: "102",
    name: "部门主管审批",
    processInstanceId: "2",
    processName: "请假审批",
    endTime: "2026-09-22 15:30:00",
    comment: "同意，3 天以内",
  },
];

/** 自动游标 */
let nextModelId = 100;
let nextInstanceId = 100;
let nextTaskId = 200;

/** 取当前时间 */
function now() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

/** 按页号切片并返回分页结果 */
function paginate<T>(list: T[], pageNum: string | undefined, pageSize: string | undefined) {
  const page = Math.max(1, Number(pageNum) || 1);
  const size = Math.max(1, Number(pageSize) || 10);
  return { list: list.slice((page - 1) * size, page * size), total: list.length };
}

/** 把流程实例转成详情：表单快照 + 审批记录 + 流程走向 */
function toInstanceDetail(instance: InstanceRow) {
  const dataJson =
    instance.businessKey === "4"
      ? JSON.stringify({
          leaveType: "annual",
          startDate: "2026-09-28",
          endDate: "2026-09-30",
          days: 3,
          reason: "家中有事",
        })
      : undefined;

  return {
    id: instance.id,
    processName: instance.processName,
    startUser: instance.startUser,
    formKey: instance.formKey,
    formJson: instance.formKey ? JSON.stringify(LEAVE_FORM_RULES) : undefined,
    optionsJson: instance.formKey
      ? JSON.stringify({ labelPosition: "top", submitButton: false })
      : undefined,
    dataJson,
    status: instance.status,
    deleteReason: instance.deleteReason,
    startTime: instance.startTime,
    endTime: instance.endTime,
    history: instance.history,
    stages: LEAVE_STAGES,
    // 运行中停在第一个审批环节，结束的取环节总数，终止的取已办环节的下一位置
    activeStageIndex:
      instance.status === "running" ? 0 : instance.status === "finished" ? LEAVE_STAGES.length : 1,
  };
}

export default defineMock([
  // 重置演示数据：把内存态恢复到初始值（放在参数化路由之前，避免 demo 被当成模型 id）
  {
    url: "workflow/models/demo/reset",
    method: ["POST"],
    body: () => {
      instances.splice(0, instances.length);
      todoTasks.splice(0, todoTasks.length);
      doneTasks.splice(0, doneTasks.length);
      return { code: "00000", data: null, msg: "演示数据已重置" };
    },
  },

  // 流程模型分页
  {
    url: "workflow/models",
    method: ["GET"],
    body: ({ query }) => {
      const keywords = String(query?.keywords ?? "").trim();
      const list = models.filter((item) => (keywords ? item.name.includes(keywords) : true));
      const page = paginate(list, query?.pageNum, query?.pageSize);
      // 列表不带 xml，避免响应过大
      return {
        code: "00000",
        data: {
          list: page.list.map(({ xml: _xml, ...rest }) => rest),
          total: page.total,
        },
        msg: "一切ok",
      };
    },
  },

  // 新增流程模型：按模型标识生成空白 BPMN 骨架
  {
    url: "workflow/models",
    method: ["POST"],
    body: ({ body }) => {
      nextModelId += 1;
      const key = String(body?.key ?? `process_${nextModelId}`);
      const name = String(body?.name ?? "未命名流程");
      models.push({
        id: String(nextModelId),
        name,
        key,
        description: body?.description ?? "",
        version: 1,
        createTime: now(),
        updateTime: now(),
        xml: blankBpmnXml(key, name),
      });
      return { code: "00000", data: null, msg: "新增流程成功" };
    },
  },

  // 模型 BPMN XML：设计器回显
  {
    url: "workflow/models/:modelId/xml",
    method: ["GET"],
    body: ({ params }) => {
      const model = models.find((item) => item.id === params.modelId);
      if (!model) return { code: "A0404", data: null, msg: "流程模型不存在" };

      return {
        code: "00000",
        data: { xml: model.xml ?? blankBpmnXml(model.key, model.name) },
        msg: "一切ok",
      };
    },
  },

  // 保存模型 BPMN XML
  {
    url: "workflow/models/:modelId/xml",
    method: ["PUT"],
    body: ({ params, body }) => {
      const model = models.find((item) => item.id === params.modelId);
      if (!model) return { code: "A0404", data: null, msg: "流程模型不存在" };

      model.xml = String(body?.xml ?? "");
      model.updateTime = now();
      return { code: "00000", data: null, msg: "保存成功" };
    },
  },

  // 部署模型（发布为流程定义）
  {
    url: "workflow/models/:modelId/deploy",
    method: ["POST"],
    body: ({ params }) => {
      const model = models.find((item) => item.id === params.modelId);
      if (!model) return { code: "A0404", data: null, msg: "流程模型不存在" };

      model.publishedVersion = model.version;
      model.definitionId = `${model.key}:${model.version}:${1001 + Number(model.id)}`;
      model.suspended = false;
      model.deploymentTime = now();
      model.updateTime = now();
      return { code: "00000", data: null, msg: "发布成功" };
    },
  },

  // 修改模型
  {
    url: "workflow/models/:modelId",
    method: ["PUT"],
    body: ({ params, body }) => {
      const model = models.find((item) => item.id === params.modelId);
      if (!model) return { code: "A0404", data: null, msg: "流程模型不存在" };

      Object.assign(model, {
        name: body?.name ?? model.name,
        description: body?.description ?? model.description,
        updateTime: now(),
      });
      return { code: "00000", data: null, msg: "修改流程成功" };
    },
  },

  // 删除模型（逗号分隔批量）
  {
    url: "workflow/models/:ids",
    method: ["DELETE"],
    body: ({ params }) => {
      const ids = String(params.ids)
        .split(",")
        .map((id) => id.trim());
      for (let i = models.length - 1; i >= 0; i -= 1) {
        if (ids.includes(models[i].id)) models.splice(i, 1);
      }
      return { code: "00000", data: null, msg: "删除成功" };
    },
  },

  // 可发起流程列表
  {
    url: "workflow/definitions/startable",
    method: ["GET"],
    body: () => ({
      code: "00000",
      data: models
        .filter((item) => item.definitionId && !item.suspended)
        .map((item) => ({
          id: item.definitionId,
          key: item.key,
          name: item.name,
          version: item.publishedVersion ?? item.version,
          formKey: item.key === "leave" ? "leave_apply" : undefined,
        })),
      msg: "一切ok",
    }),
  },

  // 流程走向预览
  {
    url: "workflow/definitions/:definitionId/stages",
    method: ["GET"],
    body: () => ({ code: "00000", data: LEAVE_STAGES, msg: "一切ok" }),
  },

  // 流程定义 XML（流程图查看）
  {
    url: "workflow/definitions/:definitionId/xml",
    method: ["GET"],
    body: ({ params }) => {
      const key = String(params.definitionId).split(":")[0];
      const model = models.find((item) => item.key === key);
      return {
        code: "00000",
        data: { xml: model?.xml ?? LEAVE_BPMN_XML },
        msg: "一切ok",
      };
    },
  },

  // 启用/停用流程定义
  {
    url: "workflow/definitions/:definitionId/state",
    method: ["PUT"],
    body: ({ params, body }) => {
      const key = String(params.definitionId).split(":")[0];
      const model = models.find((item) => item.key === key);
      if (model) model.suspended = Boolean(body?.suspend);
      return { code: "00000", data: null, msg: "操作成功" };
    },
  },

  // 待办任务（放在 tasks/:taskId 之前，避免 todo 被当成任务 id）
  {
    url: "workflow/tasks/todo",
    method: ["GET"],
    body: ({ query }) => {
      const keywords = String(query?.keywords ?? "").trim();
      const list = todoTasks.filter((item) => (keywords ? item.name.includes(keywords) : true));
      return {
        code: "00000",
        data: paginate(list, query?.pageNum, query?.pageSize),
        msg: "一切ok",
      };
    },
  },

  // 已办任务
  {
    url: "workflow/tasks/done",
    method: ["GET"],
    body: ({ query }) => {
      const keywords = String(query?.keywords ?? "").trim();
      const list = doneTasks.filter((item) => (keywords ? item.name.includes(keywords) : true));
      return {
        code: "00000",
        data: paginate(list, query?.pageNum, query?.pageSize),
        msg: "一切ok",
      };
    },
  },

  // 待办任务详情：发起表单只读回显 + 审批记录 + 流程走向
  {
    url: "workflow/tasks/:taskId",
    method: ["GET"],
    body: ({ params }) => {
      const task = todoTasks.find((item) => item.id === params.taskId);
      if (!task) return { code: "A0404", data: null, msg: "任务不存在" };

      const instance = instances.find((item) => item.id === task.processInstanceId);
      return {
        code: "00000",
        data: {
          taskId: task.id,
          taskName: task.name,
          taskDefinitionKey: task.taskDefinitionKey,
          processInstanceId: task.processInstanceId,
          processName: task.processName,
          formKey: task.formKey,
          formJson: task.formKey ? JSON.stringify(LEAVE_FORM_RULES) : undefined,
          optionsJson: task.formKey
            ? JSON.stringify({ labelPosition: "top", submitButton: false })
            : undefined,
          dataJson:
            instance?.businessKey === "4"
              ? JSON.stringify({
                  leaveType: "annual",
                  startDate: "2026-09-28",
                  endDate: "2026-09-30",
                  days: 3,
                  reason: "家中有事",
                })
              : undefined,
          history: instance?.history ?? [],
          stages: LEAVE_STAGES,
        },
        msg: "一切ok",
      };
    },
  },

  // AI 审批摘要
  {
    url: "workflow/tasks/:taskId/ai-summary",
    method: ["POST"],
    body: () => ({
      code: "00000",
      data: "申请人请年假 3 天（9/28 - 9/30），事由为家中有事；按流程规则 3 天以内由部门主管审批即可，无需总经理审批，建议同意。",
      msg: "一切ok",
    }),
  },

  // 驳回目标节点
  {
    url: "workflow/tasks/:taskId/reject-targets",
    method: ["GET"],
    body: () => ({
      code: "00000",
      data: [{ activityId: "startEvent", activityName: "开始（退回发起人）" }],
      msg: "一切ok",
    }),
  },

  // 审批通过：待办转已办，实例走到下一个环节或结束
  {
    url: "workflow/tasks/:taskId/complete",
    method: ["PUT"],
    body: ({ params, body }) => {
      const index = todoTasks.findIndex((item) => item.id === params.taskId);
      if (index < 0) return { code: "A0404", data: null, msg: "任务不存在" };

      const [task] = todoTasks.splice(index, 1);
      doneTasks.unshift({
        id: task.id,
        name: task.name,
        processInstanceId: task.processInstanceId,
        processName: task.processName,
        endTime: now(),
        comment: String(body?.comment ?? ""),
      });

      const instance = instances.find((item) => item.id === task.processInstanceId);
      if (instance) {
        instance.executedActivityIds = [...instance.executedActivityIds, "leaderApprove"];
        // 请假 3 天以内走默认分支，直接结束
        const finished = Number((body?.variables as Record<string, unknown>)?.days ?? 3) <= 3;
        if (finished) {
          instance.status = "finished";
          instance.endTime = now();
          instance.activeActivityIds = [];
          instance.executedActivityIds.push("daysGateway", "endEvent");
        } else {
          instance.activeActivityIds = ["managerApprove"];
        }

        instance.history = [
          ...instance.history,
          {
            activityId: "leaderApprove",
            activityName: "部门主管审批",
            assignee: "admin",
            comment: String(body?.comment ?? ""),
            startTime: task.createTime,
            endTime: now(),
          },
        ];
      }

      return { code: "00000", data: null, msg: "审批通过" };
    },
  },

  // 驳回：退回指定节点
  {
    url: "workflow/tasks/:taskId/reject",
    method: ["PUT"],
    body: ({ params, body }) => {
      const index = todoTasks.findIndex((item) => item.id === params.taskId);
      if (index < 0) return { code: "A0404", data: null, msg: "任务不存在" };

      const [task] = todoTasks.splice(index, 1);
      doneTasks.unshift({
        id: task.id,
        name: task.name,
        processInstanceId: task.processInstanceId,
        processName: task.processName,
        endTime: now(),
        comment: `驳回至 ${body?.targetActivityId}：${body?.comment ?? ""}`,
      });

      const instance = instances.find((item) => item.id === task.processInstanceId);
      if (instance) {
        instance.status = "terminated";
        instance.deleteReason = "审批驳回";
        instance.endTime = now();
        instance.activeActivityIds = [];
      }

      return { code: "00000", data: null, msg: "已驳回" };
    },
  },

  // 发起流程：新建实例并生成首个待办任务
  {
    url: "workflow/instances",
    method: ["POST"],
    body: ({ body }) => {
      nextInstanceId += 1;
      nextTaskId += 1;
      const definitionId = String(body?.processDefinitionId ?? "");
      const key = definitionId.split(":")[0] || "leave";
      const model = models.find((item) => item.key === key);

      const instance: InstanceRow = {
        id: String(nextInstanceId),
        processDefinitionKey: key,
        processName: model?.name ?? definitionId,
        businessKey: key === "leave" ? String(nextInstanceId) : undefined,
        formKey: key === "leave" ? "leave_apply" : undefined,
        status: "running",
        startTime: now(),
        startUser: "admin",
        executedActivityIds: ["startEvent"],
        activeActivityIds: ["leaderApprove"],
        history: [
          {
            activityId: "startEvent",
            activityName: "开始",
            assignee: "admin",
            startTime: now(),
            endTime: now(),
          },
        ],
      };
      instances.unshift(instance);

      todoTasks.unshift({
        id: String(nextTaskId),
        name: "部门主管审批",
        processInstanceId: instance.id,
        processName: instance.processName,
        businessKey: instance.businessKey,
        formKey: instance.formKey,
        taskDefinitionKey: "leaderApprove",
        createTime: now(),
      });

      return { code: "00000", data: instance.id, msg: "发起成功" };
    },
  },

  // 我的流程分页
  {
    url: "workflow/instances",
    method: ["GET"],
    body: ({ query }) => {
      const keywords = String(query?.keywords ?? "").trim();
      const list = instances.filter((item) =>
        keywords ? item.processName.includes(keywords) : true
      );
      const page = paginate(list, query?.pageNum, query?.pageSize);
      return {
        code: "00000",
        data: {
          // 只回列表字段，把审批记录/流程图节点这类大字段留给详情接口
          list: page.list.map(
            ({
              id,
              processDefinitionKey,
              processName,
              businessKey,
              formKey,
              status,
              deleteReason,
              startTime,
              endTime,
            }) => ({
              id,
              processDefinitionKey,
              processName,
              businessKey,
              formKey,
              status,
              deleteReason,
              startTime,
              endTime,
            })
          ),
          total: page.total,
        },
        msg: "一切ok",
      };
    },
  },

  // 流程图数据（bpmn-js 渲染 + 节点高亮）
  {
    url: "workflow/instances/:instanceId/diagram",
    method: ["GET"],
    body: ({ params }) => {
      const instance = instances.find((item) => item.id === params.instanceId);
      if (!instance) return { code: "A0404", data: null, msg: "流程实例不存在" };

      const model = models.find((item) => item.key === instance.processDefinitionKey);
      return {
        code: "00000",
        data: {
          bpmnXml: model?.xml ?? LEAVE_BPMN_XML,
          executedActivityIds: instance.executedActivityIds,
          activeActivityIds: instance.activeActivityIds,
        },
        msg: "一切ok",
      };
    },
  },

  // 流程实例详情
  {
    url: "workflow/instances/:instanceId",
    method: ["GET"],
    body: ({ params }) => {
      const instance = instances.find((item) => item.id === params.instanceId);
      return instance
        ? { code: "00000", data: toInstanceDetail(instance), msg: "一切ok" }
        : { code: "A0404", data: null, msg: "流程实例不存在" };
    },
  },

  // 撤销流程
  {
    url: "workflow/instances/:instanceId/cancel",
    method: ["PUT"],
    body: ({ params }) => {
      const instance = instances.find((item) => item.id === params.instanceId);
      if (!instance) return { code: "A0404", data: null, msg: "流程实例不存在" };

      instance.status = "terminated";
      instance.deleteReason = "发起人撤销";
      instance.endTime = now();
      instance.activeActivityIds = [];
      for (let i = todoTasks.length - 1; i >= 0; i -= 1) {
        if (todoTasks[i].processInstanceId === instance.id) todoTasks.splice(i, 1);
      }
      return { code: "00000", data: null, msg: "已撤销" };
    },
  },

  // 终止流程
  {
    url: "workflow/instances/:instanceId/terminate",
    method: ["PUT"],
    body: ({ params, body }) => {
      const instance = instances.find((item) => item.id === params.instanceId);
      if (!instance) return { code: "A0404", data: null, msg: "流程实例不存在" };

      instance.status = "terminated";
      instance.deleteReason = String(body?.reason ?? "管理员终止");
      instance.endTime = now();
      instance.activeActivityIds = [];
      for (let i = todoTasks.length - 1; i >= 0; i -= 1) {
        if (todoTasks[i].processInstanceId === instance.id) todoTasks.splice(i, 1);
      }
      return { code: "00000", data: null, msg: "已终止" };
    },
  },
]);

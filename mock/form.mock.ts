import { defineMock } from "./base";

/** 动态表单 mock（内存态）：表单定义 CRUD、发布、渲染与数据提交 */

/** 表单规则（与 src/components/FormRenderer/types.ts 的 FormRule 同构） */
interface FormRule {
  type?: string;
  field?: string;
  title?: string;
  value?: unknown;
  props?: Record<string, unknown>;
  options?: Array<{ label: string; value: string | number }>;
  validate?: Array<Record<string, unknown>>;
  children?: FormRule[];
  span?: number;
}

/** 表单定义行（对应 form_definition） */
interface FormRow {
  id: string;
  formKey: string;
  formName: string;
  description?: string;
  formJson: string;
  optionsJson?: string;
  status: number;
  isPublic: number;
  category: string;
  menuId?: string;
  version: number;
  createTime: string;
}

/** 表单数据行（对应 form_data） */
interface FormDataRow {
  id: string;
  formId: string;
  formKey: string;
  formVersion: number;
  dataJson: string;
  createBy?: string;
  createByName?: string;
  createTime: string;
}

/** 菜单入口配置（发布向导回显） */
interface FormMenuRow {
  menuId?: string;
  menuName: string;
  parentId: string;
  roleIds?: string[];
}

/** 全局配置：标签在顶部，显示提交按钮 */
const DEFAULT_OPTIONS = { labelPosition: "top", labelWidth: "auto", submitBtn: true };

/** 生成必填校验规则 */
function required(message: string) {
  return [{ required: true, message }];
}

/** 开源调研问卷 */
const SURVEY_RULES: FormRule[] = [
  {
    type: "input",
    field: "name",
    title: "您的称呼",
    props: { placeholder: "请输入称呼" },
    validate: required("请输入称呼"),
  },
  {
    type: "select",
    field: "role",
    title: "您的身份",
    value: "developer",
    options: [
      { label: "开发者", value: "developer" },
      { label: "运维", value: "ops" },
      { label: "产品/测试", value: "pm" },
    ],
    validate: required("请选择身份"),
  },
  {
    type: "checkbox",
    field: "modules",
    title: "用过的模块（可多选）",
    options: [
      { label: "代码生成", value: "codegen" },
      { label: "动态表单", value: "form" },
      { label: "工作流", value: "workflow" },
      { label: "多租户", value: "tenant" },
    ],
  },
  { type: "rate", field: "score", title: "整体满意度", value: 4 },
  { type: "input", field: "suggestion", title: "建议与期望", props: { placeholder: "选填" } },
];

/** 活动报名表 */
const ACTIVITY_RULES: FormRule[] = [
  { type: "input", field: "name", title: "姓名", validate: required("请输入姓名") },
  { type: "input", field: "mobile", title: "手机号", validate: required("请输入手机号") },
  {
    type: "radio",
    field: "session",
    title: "参加场次",
    value: "am",
    options: [
      { label: "上午场", value: "am" },
      { label: "下午场", value: "pm" },
    ],
  },
  {
    type: "datePicker",
    field: "arriveDate",
    title: "到场日期",
    props: { style: { width: "100%" } },
  },
  { type: "switch", field: "needLunch", title: "需要午餐", value: true },
];

/** 意见反馈 */
const FEEDBACK_RULES: FormRule[] = [
  {
    type: "select",
    field: "type",
    title: "反馈类型",
    value: "bug",
    options: [
      { label: "功能异常", value: "bug" },
      { label: "体验建议", value: "ux" },
      { label: "商务合作", value: "business" },
    ],
  },
  {
    type: "input",
    field: "content",
    title: "反馈内容",
    props: { placeholder: "请描述具体场景" },
    validate: required("请填写反馈内容"),
  },
  { type: "upload", field: "images", title: "截图（选填）" },
];

/** 请假申请单：工作流表单，字段 days 会作为流程变量驱动网关 */
const LEAVE_RULES: FormRule[] = [
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
    validate: required("请选择开始日期"),
  },
  {
    type: "datePicker",
    field: "endDate",
    title: "结束日期",
    props: { style: { width: "100%" } },
    validate: required("请选择结束日期"),
  },
  {
    type: "inputNumber",
    field: "days",
    title: "请假天数",
    value: 1,
    props: { min: 0.5, step: 0.5 },
  },
  { type: "input", field: "reason", title: "请假事由", props: { placeholder: "一句话说明事由" } },
];

/** 客户回访登记：草稿状态，用于演示状态筛选 */
const VISIT_RULES: FormRule[] = [
  { type: "input", field: "customer", title: "客户名称" },
  {
    type: "datePicker",
    field: "visitDate",
    title: "回访日期",
    props: { style: { width: "100%" } },
  },
  { type: "input", field: "summary", title: "回访纪要" },
];

/** 表单定义数据（内存态） */
const forms: FormRow[] = [
  {
    id: "1",
    formKey: "open_source_survey",
    formName: "开源调研问卷",
    description: "面向社区用户的使用情况调研",
    formJson: JSON.stringify(SURVEY_RULES),
    optionsJson: JSON.stringify({ ...DEFAULT_OPTIONS, formName: "开源调研问卷" }),
    status: 1,
    isPublic: 1,
    category: "normal",
    menuId: "8101",
    version: 2,
    createTime: "2026-09-20 10:12:00",
  },
  {
    id: "2",
    formKey: "activity_registration",
    formName: "活动报名",
    description: "线下技术沙龙报名表",
    formJson: JSON.stringify(ACTIVITY_RULES),
    optionsJson: JSON.stringify({ ...DEFAULT_OPTIONS, formName: "活动报名" }),
    status: 1,
    isPublic: 1,
    category: "normal",
    version: 1,
    createTime: "2026-09-21 09:30:00",
  },
  {
    id: "3",
    formKey: "feedback",
    formName: "意见反馈",
    description: "产品意见与问题反馈",
    formJson: JSON.stringify(FEEDBACK_RULES),
    optionsJson: JSON.stringify({ ...DEFAULT_OPTIONS, formName: "意见反馈" }),
    status: 1,
    isPublic: 1,
    category: "normal",
    version: 1,
    createTime: "2026-09-22 14:05:00",
  },
  {
    id: "4",
    formKey: "leave_apply",
    formName: "请假申请单",
    description: "请假审批流程绑定表单",
    formJson: JSON.stringify(LEAVE_RULES),
    optionsJson: JSON.stringify({ ...DEFAULT_OPTIONS, formName: "请假申请单" }),
    status: 1,
    isPublic: 0,
    category: "workflow",
    version: 1,
    createTime: "2026-09-23 11:00:00",
  },
  {
    id: "5",
    formKey: "customer_visit",
    formName: "客户回访登记",
    description: "售后回访记录（草稿）",
    formJson: JSON.stringify(VISIT_RULES),
    optionsJson: JSON.stringify({ ...DEFAULT_OPTIONS, formName: "客户回访登记" }),
    status: 0,
    isPublic: 0,
    category: "normal",
    version: 1,
    createTime: "2026-09-25 16:40:00",
  },
];

/** 表单数据（内存态） */
const formDataList: FormDataRow[] = [
  {
    id: "1",
    formId: "1",
    formKey: "open_source_survey",
    formVersion: 2,
    dataJson: JSON.stringify({
      name: "张三",
      role: "developer",
      modules: ["codegen", "form"],
      score: 4,
      suggestion: "希望补充更多后端示例",
    }),
    createBy: "2",
    createByName: "系统管理员",
    createTime: "2026-09-24 09:20:00",
  },
  {
    id: "2",
    formId: "1",
    formKey: "open_source_survey",
    formVersion: 2,
    dataJson: JSON.stringify({ name: "李四", role: "ops", modules: ["workflow"], score: 5 }),
    createBy: undefined,
    createByName: undefined,
    createTime: "2026-09-25 15:02:00",
  },
  {
    id: "3",
    formId: "2",
    formKey: "activity_registration",
    formVersion: 1,
    dataJson: JSON.stringify({
      name: "王五",
      mobile: "18812345678",
      session: "pm",
      arriveDate: "2026-10-08",
      needLunch: true,
    }),
    createBy: "2",
    createByName: "系统管理员",
    createTime: "2026-09-26 10:30:00",
  },
  {
    id: "4",
    formId: "4",
    formKey: "leave_apply",
    formVersion: 1,
    dataJson: JSON.stringify({
      leaveType: "annual",
      startDate: "2026-09-28",
      endDate: "2026-09-30",
      days: 3,
      reason: "家中有事",
    }),
    createBy: "2",
    createByName: "系统管理员",
    createTime: "2026-09-26 17:10:00",
  },
];

/** 菜单入口配置（内存态，按 formId 记） */
const formMenus: Record<string, FormMenuRow> = {
  "1": { menuId: "8101", menuName: "开源调研问卷", parentId: "8", roleIds: ["1", "2"] },
};

/** 自增游标 */
let nextFormId = 100;
let nextDataId = 100;

/** 按 id 找表单 */
function findForm(id: string) {
  return forms.find((item) => item.id === id);
}

/** 把表单定义转成列表项 */
function toListItem(row: FormRow) {
  return {
    id: row.id,
    formKey: row.formKey,
    formName: row.formName,
    description: row.description,
    status: row.status,
    version: row.version,
    isPublic: row.isPublic,
    category: row.category,
    createTime: row.createTime,
  };
}

/** 取当前时间 */
function now() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

export default defineMock([
  // 工作流表单下拉：仅已发布的 workflow 类型，必须在 forms/:id 之前注册
  {
    url: "forms/options",
    method: ["GET"],
    body: () => ({
      code: "00000",
      data: forms
        .filter((item) => item.status === 1 && item.category === "workflow")
        .map((item) => ({ value: item.formKey, label: item.formName })),
      msg: "一切ok",
    }),
  },

  // AI 生成表单规则：返回一份可直接渲染的规则 JSON 字符串
  {
    url: "forms/ai-generate",
    method: ["POST"],
    body: ({ body }) => {
      const description = String(body?.description ?? "").trim();
      const rules: FormRule[] = [
        {
          type: "input",
          field: "title",
          title: description ? `主题（${description.slice(0, 8)}）` : "主题",
          validate: required("请输入主题"),
        },
        {
          type: "select",
          field: "level",
          title: "紧急程度",
          value: "normal",
          options: [
            { label: "一般", value: "normal" },
            { label: "紧急", value: "urgent" },
          ],
        },
        {
          type: "input",
          field: "detail",
          title: "详细说明",
          props: { placeholder: "补充背景与期望" },
        },
      ];
      return { code: "00000", data: JSON.stringify(rules), msg: "一切ok" };
    },
  },

  // 公开表单渲染（匿名）：未发布或未开公开访问时报错，与后端一致
  {
    url: "forms/public/:formKey/render",
    method: ["GET"],
    body: ({ params }) => {
      const form = forms.find((item) => item.formKey === params.formKey);
      if (!form) return { code: "A0404", data: null, msg: "表单不存在" };
      if (form.status !== 1) return { code: "A0400", data: null, msg: "表单未发布" };
      if (form.isPublic !== 1) return { code: "A0403", data: null, msg: "该表单未开放公开访问" };

      return {
        code: "00000",
        data: {
          formKey: form.formKey,
          formName: form.formName,
          version: form.version,
          formJson: form.formJson,
          optionsJson: form.optionsJson,
        },
        msg: "一切ok",
      };
    },
  },

  // 匿名提交公开表单数据
  {
    url: "forms/public/:formKey/data",
    method: ["POST"],
    body: ({ params, body }) => {
      const form = forms.find((item) => item.formKey === params.formKey);
      if (!form) return { code: "A0404", data: null, msg: "表单不存在" };
      if (form.status !== 1 || form.isPublic !== 1) {
        return { code: "A0403", data: null, msg: "该表单未开放公开访问" };
      }

      nextDataId += 1;
      formDataList.push({
        id: String(nextDataId),
        formId: form.id,
        formKey: form.formKey,
        formVersion: form.version,
        dataJson: JSON.stringify(body ?? {}),
        createTime: now(),
      });
      return { code: "00000", data: null, msg: "提交成功" };
    },
  },

  // 表单定义分页
  {
    url: "forms",
    method: ["GET"],
    body: ({ query }) => {
      const keywords = String(query?.keywords ?? "").trim();
      const status =
        query?.status === undefined || query?.status === "" ? undefined : Number(query.status);
      const category = String(query?.category ?? "").trim();
      const pageNum = Math.max(1, Number(query?.pageNum) || 1);
      const pageSize = Math.max(1, Number(query?.pageSize) || 10);

      const list = forms.filter((item) => {
        if (keywords && !item.formName.includes(keywords) && !item.formKey.includes(keywords))
          return false;
        if (status !== undefined && item.status !== status) return false;
        if (category && item.category !== category) return false;
        return true;
      });

      return {
        code: "00000",
        data: {
          list: list.slice((pageNum - 1) * pageSize, pageNum * pageSize).map(toListItem),
          total: list.length,
        },
        msg: "一切ok",
      };
    },
  },

  // 表单定义详情（编辑回显，设计器要用 formJson/optionsJson）
  {
    url: "forms/:id/form",
    method: ["GET"],
    body: ({ params }) => {
      const form = findForm(String(params.id));
      return form
        ? { code: "00000", data: { ...form }, msg: "一切ok" }
        : { code: "A0404", data: null, msg: "表单不存在" };
    },
  },

  // 已发布表单渲染（填写页）
  {
    url: "forms/:formKey/render",
    method: ["GET"],
    body: ({ params }) => {
      const form = forms.find((item) => item.formKey === params.formKey);
      if (!form) return { code: "A0404", data: null, msg: "表单不存在" };
      if (form.status !== 1) return { code: "A0400", data: null, msg: "表单未发布" };

      return {
        code: "00000",
        data: {
          formKey: form.formKey,
          formName: form.formName,
          version: form.version,
          formJson: form.formJson,
          optionsJson: form.optionsJson,
        },
        msg: "一切ok",
      };
    },
  },

  // 表单数据分页
  {
    url: "forms/:formKey/data",
    method: ["GET"],
    body: ({ params, query }) => {
      const pageNum = Math.max(1, Number(query?.pageNum) || 1);
      const pageSize = Math.max(1, Number(query?.pageSize) || 10);
      const list = formDataList
        .filter((item) => item.formKey === params.formKey)
        .sort((a, b) => (a.createTime < b.createTime ? 1 : -1));

      return {
        code: "00000",
        data: {
          // 列表要带 dataJson：列是按表单字段动态生成的，值从这里取
          list: list.slice((pageNum - 1) * pageSize, pageNum * pageSize),
          total: list.length,
        },
        msg: "一切ok",
      };
    },
  },

  // 提交表单数据（后台填写页）
  {
    url: "forms/:formKey/data",
    method: ["POST"],
    body: ({ params, body }) => {
      const form = forms.find((item) => item.formKey === params.formKey);
      if (!form) return { code: "A0404", data: null, msg: "表单不存在" };

      nextDataId += 1;
      formDataList.push({
        id: String(nextDataId),
        formId: form.id,
        formKey: form.formKey,
        formVersion: form.version,
        dataJson: JSON.stringify(body ?? {}),
        createBy: "2",
        createByName: "系统管理员",
        createTime: now(),
      });
      return { code: "00000", data: null, msg: "提交成功" };
    },
  },

  // 表单数据详情：连同提交时的规则快照一起返回，与后端一致
  {
    url: "forms/:formKey/data/:dataId",
    method: ["GET"],
    body: ({ params }) => {
      const row = formDataList.find((item) => item.id === params.dataId);
      if (!row) return { code: "A0404", data: null, msg: "数据不存在" };

      const form = findForm(row.formId);
      return {
        code: "00000",
        data: {
          id: row.id,
          formVersion: row.formVersion,
          dataJson: row.dataJson,
          formJson: form?.formJson,
          optionsJson: form?.optionsJson,
          createBy: row.createBy,
          createByName: row.createByName,
          createTime: row.createTime,
        },
        msg: "一切ok",
      };
    },
  },

  // 删除表单数据（逗号分隔批量）
  {
    url: "forms/:formKey/data/:ids",
    method: ["DELETE"],
    body: ({ params }) => {
      const ids = String(params.ids)
        .split(",")
        .map((id) => id.trim());
      for (let i = formDataList.length - 1; i >= 0; i -= 1) {
        if (ids.includes(formDataList[i].id)) formDataList.splice(i, 1);
      }
      return { code: "00000", data: null, msg: "删除成功" };
    },
  },

  // 表单菜单入口配置
  {
    url: "forms/:formId/menu",
    method: ["GET"],
    body: ({ params }) => ({
      code: "00000",
      data: formMenus[String(params.formId)] ?? null,
      msg: "一切ok",
    }),
  },

  // 保存表单菜单入口
  {
    url: "forms/:formId/menu",
    method: ["POST"],
    body: ({ params, body }) => {
      const formId = String(params.formId);
      const form = findForm(formId);
      if (!form) return { code: "A0404", data: null, msg: "表单不存在" };

      formMenus[formId] = {
        menuId: formMenus[formId]?.menuId ?? String(9000 + Number(formId)),
        menuName: String(body?.menuName ?? form.formName),
        parentId: String(body?.parentId ?? "8"),
        roleIds: (body?.roleIds ?? []).map(String),
      };
      form.menuId = formMenus[formId].menuId;
      return { code: "00000", data: null, msg: "入口配置已保存" };
    },
  },

  // 新增表单定义
  {
    url: "forms",
    method: ["POST"],
    body: ({ body }) => {
      nextFormId += 1;
      forms.push({
        id: String(nextFormId),
        formKey: String(body?.formKey ?? `form_${nextFormId}`),
        formName: String(body?.formName ?? "未命名表单"),
        description: body?.description ?? "",
        formJson: String(body?.formJson ?? "[]"),
        optionsJson: body?.optionsJson ?? JSON.stringify(DEFAULT_OPTIONS),
        status: 0,
        isPublic: Number(body?.isPublic ?? 0),
        category: String(body?.category || "normal"),
        version: 1,
        createTime: now(),
      });
      return { code: "00000", data: null, msg: "新增表单成功" };
    },
  },

  // 修改表单定义（设计器保存规则）
  {
    url: "forms/:id",
    method: ["PUT"],
    body: ({ params, body }) => {
      const form = findForm(String(params.id));
      if (!form) return { code: "A0404", data: null, msg: "表单不存在" };

      Object.assign(form, {
        formName: body?.formName ?? form.formName,
        description: body?.description ?? form.description,
        formJson: body?.formJson ?? form.formJson,
        optionsJson: body?.optionsJson ?? form.optionsJson,
        isPublic: Number(body?.isPublic ?? form.isPublic),
        category: body?.category || form.category,
      });
      return { code: "00000", data: null, msg: "修改表单成功" };
    },
  },

  // 发布表单：版本号 +1
  {
    url: "forms/:id/publish",
    method: ["PUT"],
    body: ({ params }) => {
      const form = findForm(String(params.id));
      if (!form) return { code: "A0404", data: null, msg: "表单不存在" };

      form.status = 1;
      form.version += 1;
      return { code: "00000", data: null, msg: "发布成功" };
    },
  },

  // 停用表单
  {
    url: "forms/:id/disable",
    method: ["PUT"],
    body: ({ params }) => {
      const form = findForm(String(params.id));
      if (!form) return { code: "A0404", data: null, msg: "表单不存在" };

      form.status = -1;
      return { code: "00000", data: null, msg: "已停用" };
    },
  },

  // 删除表单定义（逗号分隔批量）
  {
    url: "forms/:ids",
    method: ["DELETE"],
    body: ({ params }) => {
      const ids = String(params.ids)
        .split(",")
        .map((id) => id.trim());
      for (let i = forms.length - 1; i >= 0; i -= 1) {
        if (ids.includes(forms[i].id)) forms.splice(i, 1);
      }
      return { code: "00000", data: null, msg: "删除成功" };
    },
  },
]);

import type { FormRule } from "@/components/FormRenderer/types";

/** 设计器节点 */
export interface DesignerRule extends FormRule {
  /** 设计器内部节点标识，不落库 */
  __id: string;
  /** 布局容器的子节点 */
  children?: DesignerRule[];
}

/**
 * 调色板分组
 */
export interface PaletteGroup {
  /** 分组名 */
  label: string;
  /** 分组内的字段类型 */
  items: Array<{ type: string; label: string }>;
}

/** 可与表单渲染器互认的字段类型调色板 */
export const PALETTE: PaletteGroup[] = [
  {
    label: "基础字段",
    items: [
      { type: "input", label: "单行文本" },
      { type: "inputNumber", label: "数字" },
      { type: "select", label: "下拉选择" },
      { type: "radio", label: "单选" },
      { type: "checkbox", label: "多选" },
      { type: "switch", label: "开关" },
    ],
  },
  {
    label: "高级字段",
    items: [
      { type: "datePicker", label: "日期" },
      { type: "timePicker", label: "时间" },
      { type: "cascader", label: "级联选择" },
      { type: "treeSelect", label: "树形选择" },
      { type: "inputTag", label: "标签输入" },
      { type: "slider", label: "滑块" },
      { type: "rate", label: "评分" },
      { type: "colorPicker", label: "颜色" },
      { type: "upload", label: "上传" },
    ],
  },
  {
    label: "布局容器",
    items: [
      { type: "__row", label: "一行多列" },
      { type: "div", label: "分组容器" },
      { type: "divider", label: "分割线" },
    ],
  },
];

/** 布局容器类型，这些节点本身不产生表单字段 */
export const LAYOUT_TYPES = new Set(["row", "col", "div", "card", "divider"]);

/** 选项类字段，属性面板需要提供选项编辑 */
export const OPTION_TYPES = new Set(["select", "radio", "checkbox", "treeSelect", "cascader"]);

/** 字段面板拖拽时的载体类型 */
export const FIELD_DRAG_TYPE = "application/x-form-field";

/** 递增的节点序号，仅用于生成节点标识 */
let ruleSeed = 0;

/**
 * 生成节点标识
 */
export function createRuleId(): string {
  ruleSeed += 1;
  return `rule_${Date.now().toString(36)}_${ruleSeed}`;
}

/**
 * 判断是否布局容器
 */
export function isLayoutNode(rule: DesignerRule): boolean {
  return LAYOUT_TYPES.has(String(rule.type ?? "")) || Array.isArray(rule.children);
}

/** 按类型创建字段节点 */
export function createFieldRule(type: string, fieldKey: string): DesignerRule {
  const base: DesignerRule = { __id: createRuleId(), type, field: fieldKey };

  switch (type) {
    case "input":
      return { ...base, title: "单行文本", props: { placeholder: "请输入" } };
    case "inputNumber":
      return { ...base, title: "数字", props: { placeholder: "请输入" } };
    case "select":
      return {
        ...base,
        title: "下拉选择",
        props: { placeholder: "请选择" },
        options: defaultOptions(),
      };
    case "radio":
      return { ...base, title: "单选", options: defaultOptions() };
    case "checkbox":
      return { ...base, title: "多选", options: defaultOptions() };
    case "switch":
      return { ...base, title: "开关", value: true };
    case "datePicker":
      // 渲染器读 props.type 区分 date / datetime / daterange
      return { ...base, title: "日期", props: { type: "date", valueFormat: "YYYY-MM-DD" } };
    case "timePicker":
      return { ...base, title: "时间", props: { valueFormat: "HH:mm:ss" } };
    case "cascader":
      return { ...base, title: "级联选择", props: { placeholder: "请选择", options: [] } };
    case "treeSelect":
      return { ...base, title: "树形选择", props: { placeholder: "请选择" }, options: [] };
    case "inputTag":
      return { ...base, title: "标签输入", props: { placeholder: "请输入后回车" } };
    case "slider":
      return { ...base, title: "滑块", props: { min: 0, max: 100 } };
    case "rate":
      return { ...base, title: "评分", props: { count: 5 } };
    case "colorPicker":
      return { ...base, title: "颜色" };
    case "upload":
      return {
        ...base,
        title: "上传",
        props: { listType: "picture-card", limit: 1, action: "" },
      };
    case "divider":
      return { __id: createRuleId(), type, title: "分割线" };
    case "div":
      return { __id: createRuleId(), type, title: "分组", children: [] };
    default:
      return { ...base, title: "单行文本", props: { placeholder: "请输入" } };
  }
}

/**
 * 创建一行两列布局
 */
export function createRowRule(): DesignerRule {
  return {
    __id: createRuleId(),
    type: "row",
    props: { gutter: 16 },
    children: [createColRule(), createColRule()],
  };
}

/**
 * 创建列容器
 */
export function createColRule(span = 12): DesignerRule {
  return { __id: createRuleId(), type: "col", span, children: [] };
}

/**
 * 调色板条目创建节点，__row 是「一行多列」的伪类型
 */
export function createRuleByPaletteType(type: string, fieldKey: string): DesignerRule {
  if (type === "__row") return createRowRule();
  return createFieldRule(type, fieldKey);
}

/**
 * 默认选项
 */
function defaultOptions() {
  return [
    { label: "选项一", value: "1" },
    { label: "选项二", value: "2" },
  ];
}

/**
 * 遍历所有节点
 */
export function walkRules(
  rules: DesignerRule[],
  visitor: (rule: DesignerRule, parentId: string | null) => void,
  parentId: string | null = null
): void {
  rules.forEach((rule) => {
    visitor(rule, parentId);
    if (rule.children?.length) walkRules(rule.children, visitor, rule.__id);
  });
}

/**
 * 查找节点
 */
export function findRule(rules: DesignerRule[], id: string): DesignerRule | undefined {
  let hit: DesignerRule | undefined;

  walkRules(rules, (rule) => {
    if (rule.__id === id) hit = rule;
  });

  return hit;
}

/**
 * 查找节点的父节点标识
 * @returns null 表示位于根级，undefined 表示没找到该节点
 */
export function findParentId(rules: DesignerRule[], id: string): string | null | undefined {
  let found: string | null | undefined;

  walkRules(rules, (rule, parentId) => {
    if (rule.__id === id) found = parentId;
  });

  return found;
}

/**
 * 判断 targetId 是否为 ancestorId 的后代，用于阻止把父节点拖进自己的子树
 */
export function isDescendant(rules: DesignerRule[], ancestorId: string, targetId: string): boolean {
  const ancestor = findRule(rules, ancestorId);
  if (!ancestor) return false;

  let hit = false;
  walkRules(ancestor.children ?? [], (rule) => {
    if (rule.__id === targetId) hit = true;
  });

  return hit;
}

/** 更新节点属性 */
export function updateRule(
  rules: DesignerRule[],
  id: string,
  patch: Partial<DesignerRule>
): DesignerRule[] {
  return rules.map((rule) => {
    if (rule.__id === id) {
      return {
        ...rule,
        ...patch,
        props: patch.props ? { ...rule.props, ...patch.props } : rule.props,
      };
    }

    if (rule.children?.length) {
      return { ...rule, children: updateRule(rule.children, id, patch) };
    }

    return rule;
  });
}

/**
 * 删除节点
 */
export function removeRule(rules: DesignerRule[], id: string): DesignerRule[] {
  return rules
    .filter((rule) => rule.__id !== id)
    .map((rule) =>
      rule.children?.length ? { ...rule, children: removeRule(rule.children, id) } : rule
    );
}

/**
 * 插入节点
 * @param parentId 目标容器，null 为根级
 * @param index 容器内的插入位置，缺省追加到末尾
 */
export function insertRule(
  rules: DesignerRule[],
  rule: DesignerRule,
  parentId: string | null,
  index?: number
): DesignerRule[] {
  if (parentId === null) {
    const next = [...rules];
    next.splice(index ?? next.length, 0, rule);
    return next;
  }

  return rules.map((item) => {
    if (item.__id === parentId) {
      const children = [...(item.children ?? [])];
      children.splice(index ?? children.length, 0, rule);
      return { ...item, children };
    }

    if (item.children?.length) {
      return { ...item, children: insertRule(item.children, rule, parentId, index) };
    }

    return item;
  });
}

/**
 * 相对某个节点插入新节点
 * position 为 inside 时放进目标容器，否则插到目标节点的前后
 */
export function insertRelative(
  rules: DesignerRule[],
  rule: DesignerRule,
  targetId: string,
  position: "before" | "after" | "inside"
): DesignerRule[] {
  const target = findRule(rules, targetId);
  if (!target) return rules;

  if (position === "inside") {
    if (!isLayoutNode(target)) return rules;
    return insertRule(rules, rule, targetId);
  }

  const parentId = findParentId(rules, targetId);
  if (parentId === undefined) return rules;

  const siblings = parentId === null ? rules : (findRule(rules, parentId)?.children ?? []);
  const index = siblings.findIndex((item) => item.__id === targetId);

  return insertRule(rules, rule, parentId, position === "before" ? index : index + 1);
}

/** 移动节点 */
export function moveRule(
  rules: DesignerRule[],
  dragId: string,
  targetId: string,
  position: "before" | "after" | "inside"
): DesignerRule[] {
  if (dragId === targetId) return rules;

  const dragNode = findRule(rules, dragId);
  if (!dragNode) return rules;

  // 节点不能被放进自己的子树，否则树会自引用
  if (isDescendant(rules, dragId, targetId)) return rules;

  const targetNode = findRule(rules, targetId);
  if (!targetNode) return rules;

  // 先摘下来再按落点插回去，位置计算与新增字段共用一套逻辑
  const detached = removeRule(rules, dragId);

  return insertRelative(detached, dragNode, targetId, position);
}

/** 复制节点并插入到原节点之后 */
export function duplicateRule(rules: DesignerRule[], id: string): DesignerRule[] {
  const source = findRule(rules, id);
  if (!source) return rules;

  const used = new Set(collectFieldKeys(rules));
  /** 取一个未被占用的字段名，并立刻占位避免副本内的多个字段撞名 */
  const takeKey = (type: string) => {
    const prefix = String(type ?? "field").replace(/[^a-zA-Z]/g, "") || "field";
    for (let index = 1; ; index += 1) {
      const candidate = `${prefix.toLowerCase()}_${index}`;
      if (!used.has(candidate)) {
        used.add(candidate);
        return candidate;
      }
    }
  };

  const clone = (rule: DesignerRule): DesignerRule => {
    const next: DesignerRule = { ...rule, __id: createRuleId() };
    if (rule.field) next.field = takeKey(String(rule.type));
    if (rule.children?.length) next.children = rule.children.map(clone);
    return next;
  };

  const parentId = findParentId(rules, id);
  if (parentId === undefined) return rules;

  const siblings = parentId === null ? rules : (findRule(rules, parentId)?.children ?? []);
  const index = siblings.findIndex((item) => item.__id === id);

  return insertRule(rules, clone(source), parentId, index + 1);
}

/**
 * 在兄弟节点之间上下移动
 * @param offset -1 上移，1 下移
 */
export function moveSibling(rules: DesignerRule[], id: string, offset: -1 | 1): DesignerRule[] {
  const parentId = findParentId(rules, id);
  if (parentId === undefined) return rules;

  const siblings = parentId === null ? rules : (findRule(rules, parentId)?.children ?? []);
  const index = siblings.findIndex((item) => item.__id === id);
  const target = siblings[index + offset];

  // 已经在首尾位置
  if (!target) return rules;

  return moveRule(rules, id, target.__id, offset === -1 ? "before" : "after");
}

/**
 * 收集已占用的字段名
 */
export function collectFieldKeys(rules: DesignerRule[]): string[] {
  const keys: string[] = [];

  walkRules(rules, (rule) => {
    if (rule.field) keys.push(String(rule.field));
  });

  return keys;
}

/** 生成不与现有字段冲突的字段名 */
export function nextFieldKey(rules: DesignerRule[], type: string): string {
  const used = new Set(collectFieldKeys(rules));
  const prefix = String(type ?? "field").replace(/[^a-zA-Z]/g, "") || "field";

  for (let index = 1; ; index += 1) {
    const candidate = `${prefix.toLowerCase()}_${index}`;
    if (!used.has(candidate)) return candidate;
  }
}

/** 为解析出来的规则补齐节点标识 */
export function installRuleIds(rules: FormRule[]): DesignerRule[] {
  return rules.map((rule) => {
    const node = { ...rule, __id: createRuleId() } as DesignerRule;
    if (Array.isArray(rule.children)) {
      node.children = installRuleIds(rule.children as FormRule[]);
    }
    return node;
  });
}

/**
 * 剥离设计器内部字段，产出可落库的 form-create 规则
 */
export function toFormCreateRules(rules: DesignerRule[]): FormRule[] {
  return rules.map((rule) => {
    const { __id, children, ...rest } = rule;

    return {
      ...rest,
      ...(children ? { children: toFormCreateRules(children) } : {}),
    };
  });
}

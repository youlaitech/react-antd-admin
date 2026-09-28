import type { Rule } from "antd/es/form";
import dayjs from "dayjs";

import type { FormRenderOptions, FormRule } from "./types";

/** 布局容器类型 */
const LAYOUT_TYPES = new Set([
  "row",
  "el-row",
  "col",
  "el-col",
  "div",
  "el-divider",
  "divider",
  "group",
  "el-card",
  "card",
  "template",
  "tab",
  "el-tabs",
  "tab-pane",
  "el-tab-pane",
]);

/** 组件类型别名归一 */
const TYPE_ALIASES: Record<string, string> = {
  "el-input": "input",
  "el-input-number": "inputNumber",
  textarea: "input",
  "el-select": "select",
  "el-radio": "radio",
  "el-radio-group": "radio",
  "el-checkbox": "checkbox",
  "el-checkbox-group": "checkbox",
  "el-switch": "switch",
  "el-slider": "slider",
  "el-rate": "rate",
  "el-color-picker": "colorPicker",
  "el-date-picker": "datePicker",
  "el-time-picker": "timePicker",
  "el-time-select": "timePicker",
  "el-cascader": "cascader",
  "el-tree-select": "treeSelect",
  "el-upload": "upload",
  "el-input-tag": "inputTag",
  date_picker: "datePicker",
  input_number: "inputNumber",
  time_picker: "timePicker",
  color_picker: "colorPicker",
  tree_select: "treeSelect",
  input_tag: "inputTag",
  selectmultiple: "checkbox",
};

/**
 * 解析规则 JSON，解析失败按空数组兜底
 */
export function parseRules(formJson?: string): FormRule[] {
  if (!formJson) return [];

  try {
    const parsed: unknown = JSON.parse(formJson);
    return Array.isArray(parsed) ? (parsed as FormRule[]) : [];
  } catch {
    return [];
  }
}

/**
 * 解析全局配置 JSON，解析失败按空对象兜底
 */
export function parseOptions(optionsJson?: string): FormRenderOptions {
  if (!optionsJson) return {};

  try {
    const parsed: unknown = JSON.parse(optionsJson);
    return parsed && typeof parsed === "object" ? (parsed as FormRenderOptions) : {};
  } catch {
    return {};
  }
}

/**
 * 判断是否布局容器
 */
export function isLayoutRule(rule: FormRule): boolean {
  return rule.children !== undefined || LAYOUT_TYPES.has(normalizeType(rule.type));
}

/**
 * 归一组件类型
 */
export function normalizeType(type?: string): string {
  if (!type) return "input";
  return TYPE_ALIASES[type] ?? TYPE_ALIASES[type.toLowerCase()] ?? type;
}

/**
 * 读取规则上的属性，驼峰与短横线两种写法都认
 */
export function readProp<T>(rule: FormRule, camel: string, kebab?: string): T | undefined {
  if (rule[camel] !== undefined) return rule[camel] as T;
  const key = kebab ?? camel.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  if (rule[key] !== undefined) return rule[key] as T;
  const props = rule.props;
  if (props?.[camel] !== undefined) return props[camel] as T;
  if (props?.[key] !== undefined) return props[key] as T;
  return undefined;
}

/** 规则转 antd 的校验规则 */
export function toValidateRules(rule: FormRule): Rule[] {
  const validate = rule.validate;
  if (!Array.isArray(validate) || validate.length === 0) {
    return readProp<boolean>(rule, "required")
      ? [{ required: true, message: `${rule.title ?? ""}不能为空` }]
      : [];
  }

  return validate
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const source = { ...item } as Record<string, unknown>;
      // trigger 是 element-ui 的语义，antd 的校验时机由 Form.Item 决定
      delete source.trigger;
      // JSON 里存不下函数，自定义 validator 一律丢弃，避免 antd 内部报错
      delete source.validator;

      // 正则存的是字符串，antd 只认 RegExp
      if (typeof source.pattern === "string") {
        try {
          source.pattern = new RegExp(source.pattern);
        } catch {
          delete source.pattern;
        }
      }

      return source as Rule;
    });
}

/** 默认值归一 */
export function toControlValue(type: string, value: unknown): unknown {
  if (value === undefined || value === null || value === "") return undefined;

  if (type === "datePicker" || type === "timePicker") {
    if (Array.isArray(value)) {
      return value.map((item) => (dayjs.isDayjs(item) ? item : dayjs(item as string)));
    }
    return dayjs.isDayjs(value) ? value : dayjs(value as string | number);
  }

  return value;
}

/** 提交值归一：日期组件回收成字符串 */
export function toSubmitValue(type: string, value: unknown, rule: FormRule): unknown {
  if (value === undefined || value === null) return value;

  const format =
    readProp<string>(rule, "valueFormat") ??
    (type === "timePicker" ? "HH:mm:ss" : "YYYY-MM-DD HH:mm:ss");

  if (type === "datePicker" || type === "timePicker") {
    if (Array.isArray(value)) return value.map((item) => dayjs(item as string).format(format));
    return dayjs(value as string).format(format);
  }

  return value;
}

/**
 * 递归收集所有带 field 的规则
 */
export function collectFieldRules(rules: FormRule[]): FormRule[] {
  const result: FormRule[] = [];

  rules.forEach((rule) => {
    if (rule.field) result.push(rule);
    if (Array.isArray(rule.children)) result.push(...collectFieldRules(rule.children));
  });

  return result;
}

/**
 * 按规则生成初始值
 */
export function buildInitialValues(rules: FormRule[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  collectFieldRules(rules).forEach((rule) => {
    if (!rule.field) return;
    const type = normalizeType(rule.type);
    const value = readProp<unknown>(rule, "value") ?? readProp<unknown>(rule, "defaultValue");
    if (value === undefined) return;
    values[rule.field] = toControlValue(type, value);
  });

  return values;
}

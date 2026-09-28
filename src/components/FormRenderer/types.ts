/** 动态表单规则类型 */

/** 单个表单项规则，取值时兼容驼峰与短横线两种写法 */
export interface FormRule {
  /** 组件类型，如 input / select / datePicker / el-row */
  type?: string;
  /** 字段名，布局容器没有该字段 */
  field?: string;
  /** 标签文本 */
  title?: string;
  /** 默认值 */
  value?: unknown;
  /** 透传给控件的属性 */
  props?: Record<string, unknown>;
  /** 选项类组件的选项 */
  options?: Array<{ label: string; value: string | number; disabled?: boolean }>;
  /** 校验规则（async-validator 描述，与 antd 的 rules 基本一致） */
  validate?: Array<Record<string, unknown>>;
  /** 布局容器的子节点 */
  children?: FormRule[];
  /** 是否隐藏（保留取值） */
  hidden?: boolean;
  /** 是否展示，false 等价于隐藏 */
  display?: boolean;
  /** 只读 */
  disabled?: boolean;
  /** 占位提示 */
  placeholder?: string;
  /** 栅格占位，布局容器用 */
  span?: number;
  /** 提示文字 */
  info?: string;
  /** 自定义类名 */
  class?: string;
  /** 其余未识别的属性原样保留 */
  [key: string]: unknown;
}

/**
 * 表单全局配置（后端 optionsJson 字段）
 */
export interface FormRenderOptions {
  /** 是否展示提交按钮 */
  submitBtn?: boolean;
  /** 是否展示重置按钮 */
  resetBtn?: boolean;
  /** 提交按钮文案 */
  submitBtnText?: string;
  /** 重置按钮文案 */
  resetBtnText?: string;
  /** 标签宽度 */
  labelWidth?: number | string;
  /** 标签位置 */
  labelPosition?: "left" | "right" | "top";
  /** 表单名称（画布面板里填的，非 form-create 原生字段） */
  formName?: string;
  /** 其余配置原样保留 */
  [key: string]: unknown;
}

/**
 * 规则来源：表单定义接口与渲染接口返回的 JSON 字段
 */
export interface FormRuleSource {
  /** 表单规则（form-create rule 数组 JSON 字符串） */
  formJson?: string;
  /** 表单全局配置 JSON 字符串 */
  optionsJson?: string;
}

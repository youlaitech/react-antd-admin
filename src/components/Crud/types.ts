import type { ReactNode } from "react";
import type { CascaderProps, TableProps, TreeSelectProps } from "antd";
import type { Rule } from "antd/es/form";

import type { BaseQueryParams, PageResult } from "@/api/common";

/** 通用对象，CRUD 内部按下标取值时用它承接行数据 */
export type CrudRecord = Record<string, unknown>;

/**
 * 查询参数
 * 只要求分页字段，业务侧用 interface 继承 BaseQueryParams 追加自己的条件即可
 */
export type CrudQueryParams = BaseQueryParams;

/** 表单支持的控件类型 */
export type CrudSearchComponent =
  | "input"
  | "select"
  | "input-number"
  | "switch"
  | "radio"
  | "checkbox"
  | "date-picker"
  | "date-range-picker"
  | "time-picker"
  | "time-select"
  | "tree-select"
  | "cascader"
  | "input-tag"
  | "icon-select"
  | "custom";

/** 表格列模板 */
export type CrudColumnTemplet =
  | "image"
  | "list"
  | "url"
  | "switch"
  | "input"
  | "price"
  | "percent"
  | "icon"
  | "date"
  | "tool"
  | "custom";

/** 左侧工具栏内置按钮 */
export type CrudToolbarName = "add" | "delete" | "import" | "export";

/** 右侧工具栏内置按钮 */
export type CrudDefaultToolbarName = "refresh" | "filter" | "imports" | "exports" | "search";

/** 行内操作内置按钮 */
export type CrudOperateName = "edit" | "view" | "delete";

/** 自定义按钮 */
export interface CrudToolbarButton {
  /** 按钮标识，会原样回传给 onToolbarClick / onOperate */
  name: string;
  /** 按钮文案，行内操作可传函数按行取文案 */
  text?: string | ((row: CrudRecord) => string);
  /** 权限标识，缺省时用 permPrefix + name 拼接 */
  perm?: string | string[];
  /** 图标 */
  icon?: ReactNode;
  /** 是否为危险操作 */
  danger?: boolean;
  /** 是否为主按钮 */
  primary?: boolean;
  /** 加载中（如重置演示这类耗时操作） */
  loading?: boolean;
  /** 行内操作的条件展示 */
  render?: (row: CrudRecord) => boolean;
}

/** 搜索表单项 */
export interface CrudSearchFormItem {
  /** 控件类型 */
  type: CrudSearchComponent;
  /** 标签文本 */
  label: string;
  /** 字段名 */
  prop: string;
  /** 标签旁的提示 */
  tips?: string;
  /** 控件属性 */
  attrs?: CrudRecord;
  /** select / tree-select 的选项 */
  options?: Array<{ label: string; value: string | number }>;
  /** tree-select 的树数据 */
  treeData?: TreeSelectProps["treeData"];
  /** cascader 的级联数据 */
  cascaderOptions?: CascaderProps["options"];
  /** 初始值 */
  initialValue?: unknown;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 自定义渲染 */
  render?: (value: unknown, onChange: (value: unknown) => void) => ReactNode;
}

/** 搜索区配置 */
export interface CrudSearchConfig {
  /** 权限前缀，如 sys:user */
  permPrefix?: string;
  /** 表单项 */
  formItems: CrudSearchFormItem[];
  /** 是否支持展开与收起 */
  isExpandable?: boolean;
  /** 收起状态下展示的表单项数量，缺省 3 */
  showNumber?: number;
}

/** 表格列配置 */
export interface CrudColumn<T = CrudRecord> {
  /** 列类型 */
  type?: "default" | "selection" | "index";
  /** 列标题 */
  label?: string;
  /** 字段名 */
  prop?: string;
  /** 列宽 */
  width?: number;
  /** 对齐方式 */
  align?: "left" | "center" | "right";
  /** 固定列方向，操作列常用 right */
  fixed?: "left" | "right";
  /** 是否展示，配合右侧「筛选列」开关 */
  show?: boolean;
  /** 筛选作用的字段名，缺省用 prop */
  filterKey?: string;
  /** 表头筛选项，配置后表头出现筛选菜单，筛选结果由后端查询 */
  filters?: Array<{ text: string; value: string | number }>;
  /** 表头是否多选筛选，缺省多选 */
  filterMultiple?: boolean;
  /** 多选筛选值的拼接符，配了就把数组拼成字符串传给后端 */
  filterJoin?: string;
  /** 列模板 */
  templet?: CrudColumnTemplet;
  /** list 模板的取值映射 */
  selectList?: Record<string, string>;
  /** switch 模板的取值 */
  activeValue?: boolean | string | number;
  /** switch 模板的反向取值 */
  inactiveValue?: boolean | string | number;
  /** switch 模板打开时的文案 */
  activeText?: string;
  /** switch 模板关闭时的文案 */
  inactiveText?: string;
  /** input 模板的输入类型 */
  inputType?: "text" | "number";
  /** price 模板的前缀 */
  priceFormat?: string;
  /** date 模板的格式 */
  dateFormat?: string;
  /** tool 模板的行内操作 */
  operat?: Array<CrudOperateName | CrudToolbarButton>;
  /** 自定义渲染 */
  render?: (row: T) => ReactNode;
}

/** 表格区配置 */
export interface CrudTableConfig<T = CrudRecord, Q = CrudQueryParams> {
  /** 权限前缀，如 sys:user */
  permPrefix?: string;
  /** 主键名，缺省 id */
  pk?: string;
  /** 左侧工具栏，缺省 add、delete */
  toolbar?: Array<CrudToolbarName | CrudToolbarButton>;
  /** 右侧工具栏，缺省 refresh、filter */
  defaultToolbar?: Array<CrudDefaultToolbarName | CrudToolbarButton>;
  /** 表格列 */
  cols: Array<CrudColumn<T>>;
  /**
   * 列表数据查询
   */
  indexAction: (params: Q) => Promise<PageResult<T>>;
  /** 删除，入参为逗号拼接的主键 */
  deleteAction?: (ids: string) => Promise<unknown>;
  /** 行内修改(switch 等模板用) */
  modifyAction?: (data: CrudRecord) => Promise<unknown>;
  /** 后端导出，返回二进制响应 */
  exportAction?: (params: Q) => Promise<{ data: BlobPart; headers: Record<string, unknown> }>;
  /** 前端导出的取数接口 */
  exportsAction?: (params: Q) => Promise<CrudRecord[]>;
  /** 后端导入，直接上传文件由后端解析 */
  importAction?: (file: File) => Promise<unknown>;
  /** 前端导入的提交接口 */
  importsAction?: (data: CrudRecord[]) => Promise<unknown>;
  /** 导入模板下载地址或取数函数 */
  importTemplate?: string | (() => Promise<{ data: BlobPart; headers: Record<string, unknown> }>);
  /** 是否展示分页，缺省展示 */
  pagination?: boolean;
  /** 表格横向滚动宽度 */
  scrollX?: number;
}

/** 弹窗表单项 */
export interface CrudFormItem {
  /** 控件类型 */
  type: CrudSearchComponent;
  /** 标签文本 */
  label: string;
  /** 字段名 */
  prop: string;
  /** 是否必填 */
  required?: boolean;
  /** 校验规则 */
  rules?: Rule[];
  /** 控件属性 */
  attrs?: CrudRecord;
  /** 选项 */
  options?: Array<{ label: string; value: string | number }>;
  /** cascader 的级联数据 */
  cascaderOptions?: CascaderProps["options"];
  /** 提示文字 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 标签旁的说明气泡 */
  tip?: string;
  /** 自定义渲染 */
  render?: ReactNode;
}

/** 弹窗打开模式，查看态只读 */
export type CrudModalMode = "create" | "edit" | "view";

/** 弹窗区配置 */
export interface CrudModalConfig<T = CrudRecord> {
  /** 标题 */
  title?: string;
  /** 展示形态 */
  component?: "modal" | "drawer";
  /** 宽度 */
  width?: number;
  /** 表单栅格，2 表示两列 */
  column?: number;
  /** 主键名，缺省 id */
  pk?: string;
  /** 表单项 */
  formItems: CrudFormItem[];
  /** 提交前的数据加工 */
  beforeSubmit?: (data: T) => T;
  /** 提交请求 */
  formAction?: (data: T) => Promise<unknown>;
  /**
   * 提交请求，按模式区分新增与更新；配置后优先于 formAction
   */
  submitForm?: (data: T, context: { mode: CrudModalMode; id?: string }) => Promise<unknown>;
  /** 详情数据查询，编辑与查看时用于回显 */
  detailAction?: (id: string) => Promise<T>;
}

/** 表格组件属性 */
export type CrudTableProps<T = CrudRecord> = Pick<TableProps<T>, "scroll">;

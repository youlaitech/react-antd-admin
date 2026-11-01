import { Tag } from "antd";

import type { OptionItem } from "@/api/common";
import DictSelect from "@/components/DictSelect";
import type {
  CrudFormItem,
  CrudModalConfig,
  CrudQueryParams,
  CrudSearchConfig,
  CrudTableConfig,
} from "@/components/Crud";
import { getStateOptions, toTreeData } from "./config/options";

/**
 * 示例二用的模拟行数据
 */
export interface DemoItem {
  /** 行标识 */
  id: number;
  /** 文本 */
  username: string;
  /** 头像 */
  avatar: string;
  /** 百分比 */
  percent: number;
  /** 金额 */
  price: number;
  /** 链接 */
  url: string;
  /** 图标 */
  icon: string;
  /** 性别 */
  gender: number;
  /** 自定义列的值 */
  status: number;
  /** 开关列的值 */
  status2: number;
  /** 行内输入框的值 */
  sort: number;
  /** 创建时间戳 */
  createTime: number;
}

// 示例二的模拟数据
const DEMO_ROWS: DemoItem[] = [
  {
    id: 1,
    username: "root",
    avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
    percent: 99,
    price: 10,
    url: "https://www.baidu.com",
    icon: "SettingOutlined",
    gender: 1,
    status: 1,
    status2: 1,
    sort: 99,
    createTime: 1715647982437,
  },
  {
    id: 2,
    username: "jerry",
    avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
    percent: 88,
    price: 999,
    url: "https://www.google.com",
    icon: "UserOutlined",
    gender: 0,
    status: 0,
    status2: 0,
    sort: 0,
    createTime: 1715648977426,
  },
];

/**
 * 示例二：搜索区铺开控件类型
 */
export function createDemoSearchConfig(deptOptions: OptionItem[]): CrudSearchConfig {
  return {
    isExpandable: true,
    showNumber: 3,
    formItems: [
      { type: "input", label: "输入框", prop: "testInput", attrs: { placeholder: "请输入" } },
      {
        type: "input-number",
        label: "数字输入框",
        prop: "testInputNumber",
        attrs: { placeholder: "请输入" },
      },
      {
        type: "select",
        label: "下拉选择框",
        prop: "testSelect",
        options: getStateOptions(),
        attrs: { placeholder: "全部" },
      },
      {
        type: "tree-select",
        label: "树形选择框",
        prop: "testTreeSelect",
        treeData: toTreeData(deptOptions),
        attrs: { placeholder: "请选择" },
      },
      {
        type: "cascader",
        label: "级联选择器",
        prop: "testCascader",
        cascaderOptions: [
          {
            value: "guide",
            label: "Guide",
            children: [
              {
                value: "disciplines",
                label: "Disciplines",
                children: [{ value: "consistency", label: "Consistency" }],
              },
              {
                value: "navigation",
                label: "Navigation",
                children: [{ value: "side nav", label: "Side Navigation" }],
              },
            ],
          },
        ],
      },
      {
        type: "date-range-picker",
        label: "范围选择器",
        prop: "createAt",
        attrs: { placeholder: ["开始时间", "截止时间"] },
      },
      { type: "date-picker", label: "日期选择器", prop: "testDatePicker" },
      { type: "time-picker", label: "时间选择器", prop: "testTimePicker" },
      // antd 没有固定时间点下拉，用限定步长的 TimePicker 代替 el-time-select
      { type: "time-select", label: "时间选择", prop: "testTimeSelect" },
      // el-input-tag 与 el 的 custom-tag 在 antd 里都是 tags 模式的 Select，合成一个类型即可
      { type: "input-tag", label: "标签选择器", prop: "testInputTags" },
      { type: "icon-select", label: "图标选择器", prop: "testIcon" },
    ],
  };
}

/**
 * 示例二：不接后端的表格配置
 */
export function createDemoContentConfig(): CrudTableConfig<DemoItem, CrudQueryParams> {
  return {
    pk: "id",
    pagination: true,
    toolbar: [],
    cols: [
      { type: "index", width: 50, align: "center" },
      { label: "ID", prop: "id", align: "center", show: false },
      { label: "文本", prop: "username", align: "center" },
      { label: "图片", prop: "avatar", align: "center", templet: "image" },
      { label: "百分比", prop: "percent", align: "center", templet: "percent" },
      {
        label: "货币符",
        prop: "price",
        align: "center",
        templet: "price",
        priceFormat: "$",
      },
      { label: "链接", prop: "url", width: 180, align: "center", templet: "url" },
      { label: "图标", prop: "icon", align: "center", templet: "icon" },
      {
        label: "列表值",
        prop: "gender",
        align: "center",
        templet: "list",
        selectList: { "0": "女", "1": "男" },
      },
      {
        label: "自定义",
        prop: "status",
        align: "center",
        render: (row) => (
          <Tag color={row.status === 1 ? "success" : "default"}>
            {row.status === 1 ? "启用" : "禁用"}
          </Tag>
        ),
      },
      {
        label: "Switch",
        prop: "status2",
        align: "center",
        templet: "switch",
        activeValue: 1,
        inactiveValue: 0,
        activeText: "启用",
        inactiveText: "禁用",
      },
      { label: "输入框", prop: "sort", align: "center", templet: "input", inputType: "number" },
      {
        label: "日期格式化",
        prop: "createTime",
        width: 180,
        align: "center",
        templet: "date",
        dateFormat: "YYYY/MM/DD HH:mm:ss",
      },
      {
        label: "操作栏",
        align: "center",
        width: 220,
        templet: "tool",
        operat: [
          "view",
          "edit",
          {
            name: "delete",
            text: "展示删除",
            danger: true,
            // 第一行不展示删除按钮，演示按行条件控制
            render: (row) => row.id !== 1,
          },
        ],
      },
    ],
    /**
     * 示例返回模拟数据，按分页参数切片
     */
    indexAction: (params) => {
      const pageNum = Number(params.pageNum ?? 1) || 1;
      const pageSize = Number(params.pageSize ?? DEMO_ROWS.length) || DEMO_ROWS.length;
      const start = (pageNum - 1) * pageSize;

      return Promise.resolve({
        list: DEMO_ROWS.slice(start, start + pageSize),
        total: DEMO_ROWS.length,
      });
    },
    /**
     * 真实项目在这里发请求，示例只把改动回抛出来
     */
    modifyAction: (data) => Promise.resolve(data),
  };
}

/**
 * 示例二的表单弹窗
 */
export function createDemoModalConfig(): CrudModalConfig<DemoItem> {
  const formItems: CrudFormItem[] = [
    {
      label: "文本",
      prop: "username",
      type: "input",
      required: true,
      disabled: true,
      placeholder: "请输入",
    },
    { label: "性别", prop: "gender", type: "custom", render: <DictSelect code="gender" /> },
    {
      label: "百分比",
      prop: "percent",
      type: "input-number",
      attrs: { addonAfter: "%", style: { width: "100%" } },
    },
    {
      label: "货币符",
      prop: "price",
      type: "input-number",
      attrs: { addonBefore: "$", style: { width: "100%" } },
    },
    { label: "链接", prop: "url", type: "input", placeholder: "请输入" },
    { label: "图标", prop: "icon", type: "icon-select" },
    {
      label: "自定义",
      prop: "status",
      type: "select",
      placeholder: "全部",
      options: getStateOptions(),
    },
    {
      label: "Switch",
      prop: "status2",
      type: "switch",
      attrs: { checkedChildren: "启用", unCheckedChildren: "禁用" },
    },
    { label: "输入框", prop: "sort", type: "input-number", attrs: { style: { width: "100%" } } },
    {
      label: "日期格式化",
      prop: "createTime",
      type: "date-picker",
      attrs: { showTime: true, format: "YYYY/MM/DD HH:mm:ss" },
    },
  ];

  return {
    title: "示例数据",
    component: "drawer",
    width: 480,
    column: 1,
    pk: "id",
    formItems,
    formAction: (data) => Promise.resolve(data),
  };
}

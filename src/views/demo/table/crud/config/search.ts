import type { OptionItem } from "@/api/common";
import type { CrudSearchConfig } from "@/components/Crud";
import { getStateOptions, toTreeData } from "./options";

/**
 * 示例一：贴近业务表单的搜索区
 */
export function createSearchConfig(deptOptions: OptionItem[]): CrudSearchConfig {
  return {
    permPrefix: "sys:user",
    formItems: [
      {
        tips: "支持模糊搜索",
        type: "input",
        label: "关键字",
        prop: "keywords",
        attrs: { placeholder: "用户名/昵称/手机号", style: { width: 200 } },
      },
      {
        type: "tree-select",
        label: "部门",
        prop: "deptId",
        treeData: toTreeData(deptOptions),
        attrs: { placeholder: "请选择", style: { width: 200 } },
      },
      {
        type: "select",
        label: "状态",
        prop: "status",
        options: getStateOptions(),
        attrs: { placeholder: "全部", style: { width: 200 } },
      },
      {
        type: "date-range-picker",
        label: "创建时间",
        prop: "createTime",
        attrs: {
          placeholder: ["开始时间", "截止时间"],
          style: { width: 220 },
        },
      },
    ],
  };
}

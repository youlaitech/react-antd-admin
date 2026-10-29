import { Button } from "antd";

import type { OptionItem } from "@/api/common";
import UserAPI from "@/api/system/user";
import type { UserForm } from "@/api/system/user";
import DictSelect from "@/components/DictSelect";
import type { CrudFormItem, CrudModalConfig } from "@/components/Crud";
import { toTreeData } from "./options";

/** 与后端一致的手机号与邮箱校验 */
const MOBILE_PATTERN = /^1[3-9]\d{9}$/;
const EMAIL_PATTERN = /^\w[-.\w+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,14}$/;

/**
 * 新增与编辑共用的表单项
 */
function createFormItems(
  deptOptions: OptionItem[],
  roleOptions: OptionItem[],
  readonlyUsername: boolean
): CrudFormItem[] {
  return [
    {
      label: "用户名",
      prop: "username",
      type: "input",
      required: true,
      disabled: readonlyUsername,
      placeholder: "请输入用户名",
    },
    {
      label: "用户昵称",
      prop: "nickname",
      type: "input",
      required: true,
      placeholder: "请输入用户昵称",
    },
    {
      label: "所属部门",
      prop: "deptId",
      type: "tree-select",
      required: true,
      placeholder: "请选择所属部门",
      attrs: { treeData: toTreeData(deptOptions) },
    },
    {
      label: "性别",
      prop: "gender",
      type: "custom",
      render: <DictSelect code="gender" />,
    },
    {
      label: "角色",
      prop: "roleIds",
      type: "select",
      required: true,
      placeholder: "请选择",
      options: roleOptions.map((item) => ({ label: item.label, value: item.value })),
      attrs: { mode: "multiple" },
    },
    {
      label: "手机号码",
      prop: "mobile",
      type: "input",
      placeholder: "请输入手机号码",
      rules: [{ pattern: MOBILE_PATTERN, message: "请输入正确的手机号码" }],
      attrs: { maxLength: 11 },
    },
    {
      label: "邮箱",
      prop: "email",
      type: "input",
      placeholder: "请输入邮箱",
      rules: [{ pattern: EMAIL_PATTERN, message: "请输入正确的邮箱地址" }],
      attrs: { maxLength: 50 },
    },
    {
      label: "状态",
      prop: "status",
      type: "radio",
      options: [
        { label: "正常", value: 1 },
        { label: "禁用", value: 0 },
      ],
    },
  ];
}

/**
 * 新增用户弹窗
 */
export function createAddModalConfig(
  deptOptions: OptionItem[],
  roleOptions: OptionItem[],
  onOpenSecondModal?: () => void
): CrudModalConfig<UserForm> {
  const formItems = createFormItems(deptOptions, roleOptions, false);

  if (onOpenSecondModal) {
    formItems.push({
      label: "二级弹窗",
      prop: "openModal",
      type: "custom",
      render: <Button onClick={onOpenSecondModal}>打开二级弹窗</Button>,
    });
  }

  return {
    title: "用户",
    component: "modal",
    width: 800,
    column: 2,
    pk: "id",
    formItems,
    /**
     * 新增时补上默认值
     */
    beforeSubmit: (data) => ({ status: 1, gender: 1, ...data }),
    formAction: (data) => UserAPI.create(data),
  };
}

/**
 * 二级弹窗
 */
export function createSecondModalConfig(deptOptions: OptionItem[]): CrudModalConfig<UserForm> {
  return {
    title: "二级弹窗",
    component: "modal",
    width: 500,
    column: 1,
    pk: "id",
    formItems: [
      {
        label: "用户名",
        prop: "username",
        type: "input",
        required: true,
        placeholder: "请输入",
      },
      {
        label: "用户昵称",
        prop: "nickname",
        type: "input",
        required: true,
        placeholder: "请输入",
      },
      {
        label: "所属部门",
        prop: "deptId",
        type: "tree-select",
        required: true,
        placeholder: "请选择",
        attrs: { treeData: toTreeData(deptOptions) },
      },
      {
        label: "性别",
        prop: "gender",
        type: "custom",
        render: <DictSelect code="gender" />,
      },
    ],
  };
}

/**
 * 编辑用户弹窗
 */
export function createEditModalConfig(
  deptOptions: OptionItem[],
  roleOptions: OptionItem[]
): CrudModalConfig<UserForm> {
  return {
    title: "用户",
    component: "drawer",
    width: 600,
    column: 1,
    pk: "id",
    formItems: createFormItems(deptOptions, roleOptions, true),
    detailAction: (id) => UserAPI.getFormData(id),
    formAction: (data) => UserAPI.update(data.id as string, data),
  };
}

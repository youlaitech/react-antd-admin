import { useCallback, useEffect, useMemo, useState } from "react";
import { App as AntdApp, Button, Input, Space, Tag } from "antd";
import { LinkOutlined } from "@ant-design/icons";

import type { OptionItem } from "@/api/common";
import DeptAPI from "@/api/system/dept";
import RoleAPI from "@/api/system/role";
import UserAPI from "@/api/system/user";
import type { UserForm, UserItem, UserQueryParams } from "@/api/system/user";
import CopyButton from "@/components/CopyButton";
import DictSelect from "@/components/DictSelect";
import DictTag from "@/components/DictTag";
import { CrudModal, CrudTable, useCrudPage } from "@/components/Crud";
import type { CrudFormItem, CrudSearchConfig, CrudTableConfig } from "@/components/Crud";
import { toTreeData } from "./crud/config/options";

/** 参考实现的源码地址 */
const SOURCE_URL =
  "https://gitee.com/youlaiorg/vue3-element-admin/blob/master/src/views/demo/table/crud-single.vue";

const MOBILE_PATTERN = /^1[3-9]\d{9}$/;
const EMAIL_PATTERN = /\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,14}/;

/**
 * CRUD 单文件示例
 */
export default function CrudSingleDemo() {
  const { message, modal } = AntdApp.useApp();
  const [deptOptions, setDeptOptions] = useState<OptionItem[]>([]);
  const [roleOptions, setRoleOptions] = useState<OptionItem[]>([]);

  useEffect(() => {
    Promise.all([DeptAPI.getOptions(), RoleAPI.getOptions()]).then(([dept, roles]) => {
      setDeptOptions(dept);
      setRoleOptions(roles);
    });
  }, []);

  // 重置密码：弹窗里输入新密码后调接口
  const handleResetPassword = useCallback(
    (row: UserItem) => {
      let password = "";
      modal.confirm({
        title: "重置密码",
        content: (
          <Input
            className="mt-3"
            placeholder={`请输入用户名「${row.username}」的新密码`}
            onChange={(event) => {
              password = event.target.value;
            }}
          />
        ),
        onOk: async () => {
          if (password.length < 6) {
            message.warning("密码至少需6位字符，请重新输入");
            return Promise.reject(new Error("密码过短"));
          }
          await UserAPI.resetPassword(row.id, password);
          message.success(`密码重置成功，新密码是：${password}`);
        },
      });
    },
    [message, modal]
  );

  /** 搜索条件 */
  const searchConfig: CrudSearchConfig = useMemo(
    () => ({
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
          options: [
            { label: "启用", value: 1 },
            { label: "禁用", value: 0 },
          ],
          attrs: { placeholder: "全部", style: { width: 200 } },
        },
        {
          type: "date-range-picker",
          label: "创建时间",
          prop: "createTime",
          attrs: { placeholder: ["开始时间", "截止时间"], style: { width: 220 } },
        },
      ],
    }),
    [deptOptions]
  );

  /** 表格配置 */
  const contentConfig: CrudTableConfig<UserItem, UserQueryParams> = useMemo(
    () => ({
      permPrefix: "sys:user",
      pk: "id",
      toolbar: ["add", "delete", "import", "export", { name: "custom1", text: "自定义" }],
      defaultToolbar: ["refresh", "filter", "imports", "exports", "search"],
      cols: [
        { type: "selection", width: 50, align: "center" },
        { label: "编号", prop: "id", align: "center", width: 100, show: false },
        { label: "用户名", prop: "username", align: "center" },
        { label: "头像", prop: "avatar", align: "center", templet: "image", width: 80 },
        { label: "用户昵称", prop: "nickname", align: "center", width: 120 },
        {
          label: "性别",
          prop: "gender",
          align: "center",
          width: 100,
          render: (row) => <DictTag code="gender" value={row.gender} />,
        },
        { label: "部门", prop: "deptName", align: "center", width: 120 },
        {
          label: "角色",
          prop: "roleNames",
          align: "center",
          width: 120,
          // 列上展示角色名，筛选按角色 ID，多选后拼成逗号分隔串
          filterKey: "roleIds",
          filterJoin: ",",
          filters: roleOptions.map((item) => ({ text: item.label, value: item.value })),
        },
        {
          label: "手机号码",
          prop: "mobile",
          align: "center",
          width: 160,
          render: (row) => (
            <Space size={2}>
              <span>{row.mobile}</span>
              {row.mobile && <CopyButton text={row.mobile} />}
            </Space>
          ),
        },
        {
          label: "状态",
          prop: "status",
          align: "center",
          width: 90,
          render: (row) => (
            <Tag color={row.status === 1 ? "success" : "default"}>
              {row.status === 1 ? "启用" : "禁用"}
            </Tag>
          ),
        },
        { label: "创建时间", prop: "createTime", align: "center", width: 180 },
        {
          label: "操作",
          align: "center",
          width: 280,
          templet: "tool",
          fixed: "right",
          operat: [
            { name: "detail", text: "详情" },
            { name: "reset_pwd", text: "重置密码" },
            "edit",
            "delete",
          ],
        },
      ],
      indexAction: (params) => UserAPI.getPage(params),
      deleteAction: (ids) => UserAPI.deleteByIds(ids),
      exportAction: (params) => UserAPI.export(params),
      exportsAction: async (params) => {
        const data = await UserAPI.getPage(params);
        return data.list as unknown as Record<string, unknown>[];
      },
      importAction: (file) => UserAPI.import(file),
      importTemplate: () => UserAPI.downloadTemplate(),
      /**
       * 示例里不做真实入库，导入的数据直接丢掉
       */
      importsAction: () => Promise.resolve(),
    }),
    [roleOptions]
  );

  /**
   * 新增与编辑共用的表单项，编辑时用户名只读
   */
  const createFormItems = (readonlyUsername: boolean): CrudFormItem[] => [
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

  const addModalConfig = useMemo(
    () => ({
      title: "用户",
      component: "modal" as const,
      width: 640,
      column: 1,
      pk: "id",
      formItems: createFormItems(false),
      beforeSubmit: (data: UserForm) => ({ status: 1, gender: 1, ...data }),
      formAction: (data: UserForm) => UserAPI.create(data),
    }),
    // createFormItems 依赖部门与角色下拉
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roleOptions, deptOptions]
  );

  const editModalConfig = useMemo(
    () => ({
      title: "用户",
      component: "drawer" as const,
      width: 520,
      column: 1,
      pk: "id",
      // 编辑时状态用开关，值域与单选不同，所以单独配一份
      formItems: createFormItems(true).map((item) =>
        item.prop === "status"
          ? {
              ...item,
              type: "switch" as const,
              options: undefined,
              attrs: { checkedChildren: "正常", unCheckedChildren: "禁用" },
            }
          : item
      ),
      detailAction: (id: string) => UserAPI.getFormData(id) as unknown as Promise<UserForm>,
      formAction: (data: UserForm) => UserAPI.update(data.id as string, data),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roleOptions, deptOptions]
  );

  const crud = useCrudPage<UserItem, UserQueryParams, UserForm>({
    table: contentConfig,
    search: searchConfig,
    modal: (isEdit) => (isEdit ? editModalConfig : addModalConfig),
    onOperate: (name, row) => {
      if (name === "detail") {
        // 详情复用编辑表单，数据来源一致
        void crud.openEdit(row);
        return;
      }
      if (name === "reset_pwd") handleResetPassword(row);
    },
    onToolbarClick: (name) => {
      if (name === "custom1") message.success("点击了自定义1按钮");
    },
  });

  return (
    <div className="page-container">
      <div>
        <Button type="link" size="small" href={SOURCE_URL} target="_blank" icon={<LinkOutlined />}>
          参考源码
        </Button>
      </div>

      <CrudTable<UserItem, UserQueryParams> {...crud.tableProps} />
      {crud.modalProps && <CrudModal {...crud.modalProps} />}
    </div>
  );
}

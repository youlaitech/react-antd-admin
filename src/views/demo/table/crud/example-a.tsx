import { useCallback, useMemo, useRef, useState } from "react";
import { App as AntdApp, Form, Input } from "antd";

import UserAPI from "@/api/system/user";
import type { UserForm, UserItem, UserQueryParams } from "@/api/system/user";
import { CrudModal, CrudTable, useCrudPage } from "@/components/Crud";
import { validateForm } from "@/utils/form";
import { createContentConfig } from "./config/content";
import {
  createAddModalConfig,
  createEditModalConfig,
  createSecondModalConfig,
} from "./config/form";
import { useOptions } from "./config/options";
import { createSearchConfig } from "./config/search";

/**
 * 示例一：贴近业务的完整用法
 */
export default function ExampleA() {
  const { message, modal } = AntdApp.useApp();
  const { deptOptions, roleOptions } = useOptions();

  /** onOperate 里要用到 useCrudPage 的返回值，而它本身就是 useCrudPage 的入参 */
  const openEditRef = useRef<(row: UserItem) => void>(() => undefined);
  // 弹窗里的密码输入值闭包取不到最新 state，用 ref 存
  const passwordRef = useRef("");

  // 二级弹窗自己维护开关与表单，不接后端
  const [secondOpen, setSecondOpen] = useState(false);
  const [secondSubmitting, setSecondSubmitting] = useState(false);
  const [secondForm] = Form.useForm<Record<string, unknown>>();

  // 重置密码，走真实接口
  const handleResetPassword = useCallback(
    (row: UserItem) => {
      passwordRef.current = "";
      modal.confirm({
        title: "重置密码",
        content: (
          <Input
            className="mt-3"
            placeholder={`请输入用户名「${row.username}」的新密码`}
            onChange={(event) => {
              passwordRef.current = event.target.value;
            }}
          />
        ),
        onOk: async () => {
          const password = passwordRef.current;
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

  const contentConfig = useMemo(() => createContentConfig(roleOptions), [roleOptions]);
  const searchConfig = useMemo(() => createSearchConfig(deptOptions), [deptOptions]);
  const secondModalConfig = useMemo(() => createSecondModalConfig(deptOptions), [deptOptions]);

  // 新增用 Modal、编辑用 Drawer，按编辑态返回不同配置
  const modalConfig = useCallback(
    (isEdit: boolean) =>
      isEdit
        ? createEditModalConfig(deptOptions, roleOptions)
        : createAddModalConfig(deptOptions, roleOptions, () => {
            secondForm.resetFields();
            setSecondOpen(true);
          }),
    [deptOptions, roleOptions, secondForm]
  );

  /**
   * 二级弹窗提交：示例里只校验并提示，不发请求
   */
  async function handleSecondSubmit() {
    const values = await validateForm(secondForm);
    if (!values) return;

    setSecondSubmitting(true);
    try {
      message.success("二级弹窗提交成功");
      setSecondOpen(false);
    } finally {
      setSecondSubmitting(false);
    }
  }

  const crud = useCrudPage<UserItem, UserQueryParams, UserForm>({
    table: contentConfig,
    search: searchConfig,
    modal: modalConfig,
    onOperate: (name, row) => {
      if (name === "detail") {
        // 详情复用编辑弹窗，数据来源一致，只是标题不同
        openEditRef.current(row);
        return;
      }
      if (name === "reset_pwd") handleResetPassword(row);
    },
    onToolbarClick: (name) => {
      if (name === "custom1") message.success("点击了自定义1按钮");
    },
  });

  const { openEdit } = crud;
  openEditRef.current = (row) => {
    void openEdit(row);
  };

  return (
    <>
      <CrudTable<UserItem, UserQueryParams> {...crud.tableProps} />
      {crud.modalProps && <CrudModal {...crud.modalProps} />}

      <CrudModal<UserForm>
        config={secondModalConfig}
        form={secondForm}
        open={secondOpen}
        mode="create"
        isEdit={false}
        submitting={secondSubmitting}
        onClose={() => setSecondOpen(false)}
        onSubmit={handleSecondSubmit}
      />
    </>
  );
}

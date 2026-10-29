import { Space, Tag } from "antd";

import type { OptionItem } from "@/api/common";
import UserAPI from "@/api/system/user";
import type { UserItem, UserQueryParams } from "@/api/system/user";
import CopyButton from "@/components/CopyButton";
import DictTag from "@/components/DictTag";
import type { CrudRecord, CrudTableConfig } from "@/components/Crud";

/**
 * 示例一：贴近业务列表的完整配置
 */
export function createContentConfig(
  roleOptions: OptionItem[]
): CrudTableConfig<UserItem, UserQueryParams> {
  return {
    // 权限前缀，用于把「edit」这类短标识拼成 sys:user:update
    permPrefix: "sys:user",
    pk: "id",
    toolbar: ["add", "delete", "import", "export", { name: "custom1", text: "自定义1" }],
    defaultToolbar: ["refresh", "filter", "imports", "exports", "search"],
    cols: [
      { type: "selection", width: 50, align: "center" },
      { label: "编号", prop: "id", width: 100, align: "center", show: false },
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
        width: 140,
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
        operat: [
          { name: "detail", text: "详情" },
          { name: "reset_pwd", text: "重置密码" },
          "edit",
          "delete",
        ],
      },
    ],
    /**
     * 列表数据查询
     */
    indexAction: (params) => UserAPI.getPage(params),
    deleteAction: (ids) => UserAPI.deleteByIds(ids),
    exportAction: (params) => UserAPI.export(params),
    /**
     * 前端导出：示例直接拿分页接口当全量取数用
     */
    exportsAction: async (params) =>
      (await UserAPI.getPage(params)).list as unknown as CrudRecord[],
    importAction: (file) => UserAPI.import(file),
    /**
     * 前端导入：示例里不做真实入库
     */
    importsAction: () => Promise.resolve(),
    importTemplate: () => UserAPI.downloadTemplate(),
  };
}

import { Tag } from "antd";
import type { TFunction } from "i18next";

import UserAPI from "@/api/system/user";
import type { UserItem, UserQueryParams } from "@/api/system/user";
import DictTag from "@/components/DictTag";
import type { TableSelectConfig } from "@/components/TableSelect";
import { CommonStatus } from "@/enums";

/** 组装用户列表选择器的配置 */
export function buildUserSelectConfig(t: TFunction): TableSelectConfig<UserItem> {
  return {
    pk: "id",
    width: "70%",
    placeholder: t("demo.tableSelect.placeholder"),
    formItems: [
      { type: "input", label: t("common.keyword"), prop: "keywords", width: 200 },
      {
        type: "tree-select",
        label: t("system.user.dept"),
        prop: "deptId",
        width: 150,
        treeData: [
          {
            value: "1",
            label: "有来技术",
            children: [
              { value: "2", label: "研发部门" },
              { value: "3", label: "测试部门" },
            ],
          },
        ],
      },
      {
        type: "select",
        label: t("common.status"),
        prop: "status",
        width: 100,
        options: [
          { label: t("common.enabled"), value: CommonStatus.ENABLED },
          { label: t("common.disabled"), value: CommonStatus.DISABLED },
        ],
      },
      { type: "date-picker", label: t("common.createTime"), prop: "createAt", width: 240 },
    ],
    /** 列表数据查询 */
    async indexAction(params) {
      const createAt = params.createAt as string[] | undefined;

      const query: UserQueryParams = {
        pageNum: Number(params.pageNum),
        pageSize: Number(params.pageSize),
        keywords: params.keywords as string | undefined,
        deptId: params.deptId as string | undefined,
        status: params.status as number | undefined,
      };

      if (createAt && createAt.length > 1) {
        query.createTime = [createAt[0], createAt[1]];
      }

      return UserAPI.getPage(query);
    },
    tableColumns: [
      { label: t("demo.tableSelect.id"), prop: "id", width: 100, align: "center" },
      { label: t("system.user.username"), prop: "username", align: "center" },
      { label: t("system.user.nickname"), prop: "nickname", width: 120, align: "center" },
      {
        label: t("system.user.gender"),
        prop: "gender",
        width: 100,
        align: "center",
        render: (record) => <DictTag code="gender" value={record.gender} />,
      },
      { label: t("system.user.dept"), prop: "deptName", width: 120, align: "center" },
      { label: t("system.user.mobile"), prop: "mobile", width: 120, align: "center" },
      {
        label: t("common.status"),
        prop: "status",
        width: 100,
        align: "center",
        render: (record) =>
          record.status === CommonStatus.ENABLED ? (
            <Tag color="success">{t("common.enabled")}</Tag>
          ) : (
            <Tag color="default">{t("common.disabled")}</Tag>
          ),
      },
      { label: t("common.createTime"), prop: "createTime", width: 180, align: "center" },
    ],
  };
}

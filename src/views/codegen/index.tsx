import { useCallback, useMemo, useRef, useState } from "react";
import { App as AntdApp } from "antd";

import GeneratorAPI from "@/api/codegen";
import type { TableItem, TableQueryParams } from "@/api/codegen";
import { CrudTable, useCrudPage } from "@/components/Crud";
import type { CrudTableConfig } from "@/components/Crud";
import GeneratorDrawer from "./GeneratorDrawer";

/** 表已配置代码生成 */
const TABLE_CONFIGURED = 1;

/** 代码生成 */
export default function Codegen() {
  const { message, modal } = AntdApp.useApp();
  /** 正在生成代码的表名，undefined 表示抽屉关闭 */
  const [drawerTable, setDrawerTable] = useState<string>();

  // reload 由 useCrudPage 提供，而它需要先拿到 onOperate 回调，用 ref 承接
  const reloadRef = useRef<() => void>(() => undefined);

  /** 重置指定表的生成配置 */
  const handleResetConfig = useCallback(
    (tableName: string) => {
      modal.confirm({
        title: "提示",
        content: "确定要重置配置吗？",
        okButtonProps: { danger: true },
        onOk: async () => {
          await GeneratorAPI.resetGenConfig(tableName);
          message.success("重置成功");
          reloadRef.current();
        },
      });
    },
    [message, modal]
  );

  const tableConfig: CrudTableConfig<TableItem, TableQueryParams> = useMemo(
    () => ({
      permPrefix: "codegen",
      // 表名是唯一标识，没有 id 字段
      pk: "tableName",
      toolbar: [],
      defaultToolbar: ["refresh"],
      cols: [
        { type: "selection", width: 55, align: "center" },
        { label: "表名", prop: "tableName", width: 200 },
        { label: "描述", prop: "tableComment", width: 150 },
        { label: "存储引擎", prop: "engine", align: "center" },
        { label: "排序规则", prop: "tableCollation", align: "center" },
        { label: "创建时间", prop: "createTime", width: 170, align: "center" },
        {
          label: "操作",
          width: 200,
          align: "center",
          templet: "tool",
          operat: [
            { name: "generate", text: "生成代码" },
            {
              name: "reset_config",
              text: "重置配置",
              danger: true,
              render: (row) => Number(row.isConfigured) === TABLE_CONFIGURED,
            },
          ],
        },
      ],
      indexAction: (params) => GeneratorAPI.getTablePage(params),
    }),
    []
  );

  const crud = useCrudPage<TableItem, TableQueryParams>({
    table: tableConfig,
    initialParams: {},
    search: {
      permPrefix: "codegen",
      formItems: [
        { type: "input", label: "关键字", prop: "keywords", attrs: { placeholder: "表名" } },
      ],
    },
    onOperate: (name, row) => {
      if (name === "generate") {
        setDrawerTable(row.tableName);
        return;
      }
      if (name === "reset_config") handleResetConfig(row.tableName);
    },
  });

  reloadRef.current = crud.reload;

  return (
    <div className="page-container">
      <CrudTable<TableItem, TableQueryParams> {...crud.tableProps} />

      <GeneratorDrawer
        tableName={drawerTable}
        onClose={() => setDrawerTable(undefined)}
        onSuccess={crud.reload}
      />
    </div>
  );
}

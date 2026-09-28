import { useMemo } from "react";

import type { CrudQueryParams } from "@/components/Crud";
import { CrudModal, CrudTable, useCrudPage } from "@/components/Crud";
import {
  createDemoContentConfig,
  createDemoModalConfig,
  createDemoSearchConfig,
  type DemoItem,
} from "./config2";
import { useOptions } from "./config/options";

/** 示例二：不接后端，铺开控件与列模板 */
export default function ExampleB() {
  const { deptOptions } = useOptions();

  const contentConfig = useMemo(() => createDemoContentConfig(), []);
  const searchConfig = useMemo(() => createDemoSearchConfig(deptOptions), [deptOptions]);
  const modalConfig = useMemo(() => createDemoModalConfig(), []);

  const crud = useCrudPage<DemoItem, CrudQueryParams, DemoItem>({
    table: contentConfig,
    search: searchConfig,
    modal: modalConfig,
  });

  return (
    <>
      <CrudTable<DemoItem, CrudQueryParams> {...crud.tableProps} />
      {crud.modalProps && <CrudModal {...crud.modalProps} />}
    </>
  );
}

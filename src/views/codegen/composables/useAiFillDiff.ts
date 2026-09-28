import { useCallback, useRef, useState } from "react";

import type { FieldConfig, GenConfigForm } from "@/api/codegen";
import { formTypeOptions, queryTypeOptions } from "@/enums";

/** 参与比对的字段属性 */
const FIELD_ITEMS = [
  { prop: "fieldComment", label: "描述" },
  { prop: "isShowInList", label: "列表" },
  { prop: "isShowInForm", label: "表单" },
  { prop: "isShowInQuery", label: "查询" },
  { prop: "queryType", label: "查询方式" },
  { prop: "formType", label: "表单类型" },
  { prop: "dictType", label: "字典" },
  { prop: "isRequired", label: "必填" },
] as const;

/** 单处改动 */
export interface AiChangeItem {
  /** 改动项名称 */
  label: string;
  /** 改动前的展示值 */
  from: string;
  /** 改动后的展示值 */
  to: string;
}

/** 一个字段上的全部改动 */
export interface AiFieldChange {
  /** 数据库列名 */
  columnName: string;
  /** 字段名 */
  fieldName: string;
  /** 改动明细 */
  changes: AiChangeItem[];
}

/** AI 填充的改动汇总 */
export interface AiFillDiff {
  /** 业务名改动 */
  businessName?: AiChangeItem;
  /** 字段改动 */
  fields: AiFieldChange[];
  /** 涉及改动的字段数 */
  fieldCount: number;
  /** 改动总处数 */
  changeCount: number;
}

/** 把字段值翻成可读文本 */
function formatValue(prop: string, value: unknown): string {
  if (value === undefined || value === null || value === "") return "-";

  if (prop === "queryType") {
    return queryTypeOptions.find((item) => item.value === Number(value))?.label ?? String(value);
  }
  if (prop === "formType") {
    return formTypeOptions.find((item) => item.value === Number(value))?.label ?? String(value);
  }
  if (prop.startsWith("is")) return Number(value) === 1 ? "是" : "否";

  return String(value);
}

/** 比对两份生成配置，得出 AI 究竟改了什么 */
export function diffGenConfig(before: GenConfigForm, after: GenConfigForm): AiFillDiff {
  const fields: AiFieldChange[] = [];
  const beforeMap = new Map<string, FieldConfig>(
    (before.fieldConfigs ?? []).map((field) => [String(field.columnName), field])
  );

  (after.fieldConfigs ?? []).forEach((field) => {
    const previous = beforeMap.get(String(field.columnName));
    if (!previous) return;

    const changes: AiChangeItem[] = [];
    FIELD_ITEMS.forEach((item) => {
      const from = formatValue(item.prop, (previous as Record<string, unknown>)[item.prop]);
      const to = formatValue(item.prop, (field as Record<string, unknown>)[item.prop]);
      if (from !== to) changes.push({ label: item.label, from, to });
    });

    if (changes.length) {
      fields.push({
        columnName: String(field.columnName),
        fieldName: field.fieldName ?? String(field.columnName),
        changes,
      });
    }
  });

  const businessName: AiChangeItem | undefined =
    (before.businessName ?? "") === (after.businessName ?? "")
      ? undefined
      : {
          label: "业务名",
          from: before.businessName || "-",
          to: after.businessName || "-",
        };

  return {
    businessName,
    fields,
    fieldCount: fields.length,
    changeCount:
      fields.reduce((total, item) => total + item.changes.length, 0) + (businessName ? 1 : 0),
  };
}

/** AI 推断的改动明细与撤销 */
export function useAiFillDiff() {
  const snapshotRef = useRef<GenConfigForm | null>(null);
  const [diff, setDiff] = useState<AiFillDiff>();
  const [diffOpen, setDiffOpen] = useState(false);

  /** 记录推断前的配置快照 */
  const takeSnapshot = useCallback((config: GenConfigForm) => {
    snapshotRef.current = structuredClone(config);
  }, []);

  /** 与快照比对，返回改动明细 */
  const resolveDiff = useCallback((next: GenConfigForm) => {
    if (!snapshotRef.current) return undefined;

    const result = diffGenConfig(snapshotRef.current, next);
    setDiff(result);
    return result;
  }, []);

  /** 撤销：返回快照那一版配置，由调用方写回状态 */
  const undo = useCallback(() => {
    const snapshot = snapshotRef.current;
    if (!snapshot) return undefined;

    snapshotRef.current = null;
    setDiff(undefined);
    setDiffOpen(false);
    return structuredClone(snapshot);
  }, []);

  /** 清空改动记录（如关闭抽屉时） */
  const clear = useCallback(() => {
    snapshotRef.current = null;
    setDiff(undefined);
    setDiffOpen(false);
  }, []);

  return {
    diff,
    diffOpen,
    setDiffOpen,
    takeSnapshot,
    resolveDiff,
    undo,
    clear,
    /** 有改动记录时可查看明细与撤销 */
    hasDiff: Boolean(diff && diff.changeCount > 0),
    /** 被 AI 改动过的列名，用于在字段列表里打标 */
    changedColumns: new Set(diff?.fields.map((item) => item.columnName) ?? []),
  };
}

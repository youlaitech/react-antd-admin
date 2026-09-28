import { useMemo } from "react";

import FormRenderer from "@/components/FormRenderer";
import { parseOptions, parseRules } from "@/components/FormRenderer/rule";
import type { FormRule } from "@/components/FormRenderer/types";
import { parseDataJson } from "@/utils/form-field";

interface FormDetailProps {
  /** 表单规则（form-create rule 数组 JSON 字符串） */
  formJson?: string;
  /** 表单全局配置 JSON 字符串 */
  optionsJson?: string;
  /** 表单数据（field -> value 映射的 JSON 字符串） */
  dataJson?: string;
}

/** 递归移除校验规则 */
function stripValidate(rules: FormRule[]): FormRule[] {
  return rules.map((rule) => ({
    ...rule,
    validate: undefined,
    children: Array.isArray(rule.children)
      ? stripValidate(rule.children as FormRule[])
      : rule.children,
  }));
}

/** 表单只读回显 */
export default function FormDetail({ formJson, optionsJson, dataJson }: FormDetailProps) {
  const rules = useMemo(() => stripValidate(parseRules(formJson)), [formJson]);
  const options = useMemo(() => parseOptions(optionsJson), [optionsJson]);
  const values = useMemo(() => parseDataJson(dataJson), [dataJson]);

  return (
    <FormRenderer
      title=""
      rules={rules}
      options={options}
      defaultValues={values}
      readOnly
      onFinish={() => undefined}
    />
  );
}

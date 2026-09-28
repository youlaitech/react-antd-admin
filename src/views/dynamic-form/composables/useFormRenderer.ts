import { useCallback, useState } from "react";

import { parseOptions, parseRules } from "@/components/FormRenderer/rule";
import type { FormRenderOptions, FormRule, FormRuleSource } from "@/components/FormRenderer/types";

/**
 * 表单规则加载与渲染状态
 * @param loader 规则加载函数，需要调用方用 useCallback 固定引用
 */
export function useFormRenderer<T extends FormRuleSource>(
  loader: () => Promise<T | null | undefined>
) {
  const [rules, setRules] = useState<FormRule[]>([]);
  const [options, setOptions] = useState<FormRenderOptions>({ submitBtn: true });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /** 加载并解析规则，返回接口原始数据 */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loader();

      setRules(parseRules(data?.formJson));
      // 强制开启提交按钮：设计器保存时可能把它关掉了，但填写页必须有提交入口
      setOptions({ ...parseOptions(data?.optionsJson), submitBtn: true });

      return data ?? undefined;
    } finally {
      setLoading(false);
    }
  }, [loader]);

  /** 回到填写态 */
  const refill = useCallback(() => setSubmitted(false), []);

  return { rules, options, loading, submitted, setSubmitted, load, refill };
}

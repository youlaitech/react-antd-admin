import { useCallback, useMemo } from "react";
import { Checkbox, Radio, Select } from "antd";
import { useTranslation } from "react-i18next";

import { useDict } from "@/hooks/useDict";

/**
 * 字典选择器的展示形态
 */
type DictSelectType = "select" | "radio" | "checkbox";

interface DictSelectProps {
  /** 字典编码 */
  code: string;
  /** 展示形态 */
  type?: DictSelectType;
  /** 提示文字 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 外层类名 */
  className?: string;
  /** 选中值，多选形态为数组 */
  value?: string | number | Array<string | number>;
  /** 选中回调 */
  onChange?: (value: string | number | Array<string | number>) => void;
}

/**
 * 字典选择器
 */
export default function DictSelect({
  code,
  type = "select",
  placeholder,
  disabled,
  className,
  value,
  onChange,
}: DictSelectProps) {
  const { t } = useTranslation();
  const options = useDict(code);

  const optionList = useMemo(
    () => options.map((item) => ({ label: item.label, value: item.value })),
    [options],
  );

  // 字典值可能是数字而外部传入的是字符串，统一按字符串比较，否则选中项匹配不上
  const alignValue = useCallback(
    (raw: string | number) =>
      optionList.find((option) => String(option.value) === String(raw))?.value ?? raw,
    [optionList],
  );

  if (type === "radio") {
    const current = Array.isArray(value) ? value[0] : value;
    return (
      <Radio.Group
        className={className}
        disabled={disabled}
        value={current === undefined ? undefined : alignValue(current)}
        onChange={(event) => onChange?.(event.target.value)}
        options={optionList}
      />
    );
  }

  if (type === "checkbox") {
    const current = Array.isArray(value) ? value.map(alignValue) : [];
    return (
      <Checkbox.Group
        className={className}
        disabled={disabled}
        value={current}
        onChange={(checked) => onChange?.(checked as Array<string | number>)}
        options={optionList}
      />
    );
  }

  const current = Array.isArray(value) ? undefined : value;
  return (
    <Select
      className={className}
      disabled={disabled}
      allowClear
      placeholder={placeholder ?? t("common.pleaseSelect")}
      value={current === undefined || current === null ? undefined : alignValue(current)}
      onChange={(selected) => onChange?.(selected)}
      options={optionList}
    />
  );
}

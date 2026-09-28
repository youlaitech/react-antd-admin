import { Tag } from "antd";

import { useDict } from "@/hooks/useDict";
import { toTagColor } from "@/utils/dict";

interface DictTagProps {
  /** 字典编码 */
  code?: string;
  /** 字典项的值 */
  value?: string | number;
}

/** 字典标签 */
export default function DictTag({ code, value }: DictTagProps) {
  const options = useDict(code ?? "");

  const item = options.find((option) => String(option.value) === String(value));
  const tagColor = toTagColor(item?.tagType);

  if (!item || !tagColor) {
    return <span>{item?.label ?? ""}</span>;
  }

  return <Tag color={tagColor}>{item.label}</Tag>;
}

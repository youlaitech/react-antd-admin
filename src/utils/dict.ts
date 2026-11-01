import type { DictTagType } from "@/api/system/dict";

// 标签样式到 antd Tag 颜色的换算表
const TAG_COLOR_MAP: Record<string, string> = {
  primary: "processing",
  success: "success",
  warning: "warning",
  danger: "error",
  info: "default",
};

/**
 * 字典标签样式转 antd Tag 的颜色
 * @param tagType 后端返回的标签样式，为空表示不显示标签
 * @returns antd Tag 的 color 值，为空时返回 undefined，调用方按纯文本渲染
 */
export function toTagColor(tagType?: DictTagType | string): string | undefined {
  if (!tagType) return undefined;
  return TAG_COLOR_MAP[tagType] ?? tagType;
}

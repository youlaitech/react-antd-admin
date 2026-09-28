import { antdIcons } from "@/constants/antd-icons";
import { localIconNames } from "@/constants/icons";

/** 去掉 antd 图标的风格后缀，只留语义部分 */
function toSemanticName(name: string): string {
  return name.replace(/(Outlined|Filled|TwoTone)$/i, "").toLowerCase();
}

/**
 * 按候选关键词取出图标名
 * @param names 图标名清单
 * @param keywords 候选关键词，按贴切程度排列
 * @param loose 是否用包含匹配
 */
function pickIcon(names: string[], keywords: string[], loose: boolean): string {
  for (const keyword of keywords) {
    const hit = names.find((name) => {
      const target = loose ? toSemanticName(name) : name.toLowerCase();
      return loose ? target.includes(keyword) : target === keyword;
    });
    if (hit) return hit;
  }

  return "";
}

/**
 * 按关键词匹配图标
 * @param keywords 图标关键词，按贴切程度排列
 */
export function matchIcon(keywords: string[]): string {
  const candidates = keywords
    .filter(Boolean)
    .map((keyword) =>
      keyword
        .trim()
        .toLowerCase()
        .replace(/^el-icon-/, "")
    )
    .filter(Boolean);

  if (candidates.length === 0) return "";

  const svg = pickIcon(localIconNames, candidates, false);
  if (svg) return svg;

  const antdNames = Object.keys(antdIcons);
  const antd = pickIcon(antdNames, candidates, false);
  if (antd) return antd;

  const svgLoose = pickIcon(localIconNames, candidates, true);
  return svgLoose || pickIcon(antdNames, candidates, true);
}

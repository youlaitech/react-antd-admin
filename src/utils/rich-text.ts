/** 编辑器清空内容后留下的占位 HTML */
const EMPTY_HTML = ["<p><br></p>", "<p></p>", "<br>"];

/** 判断富文本是否为空 */
export function isRichTextEmpty(html?: string): boolean {
  if (!html) return true;
  return EMPTY_HTML.includes(html.trim());
}

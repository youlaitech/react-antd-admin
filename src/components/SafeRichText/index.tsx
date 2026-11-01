import DOMPurify from "dompurify";

interface SafeRichTextProps {
  /** 待展示的富文本 HTML */
  html: string;
}

/**
 * 白名单清洗后展示富文本，保留编辑器常用排版并移除主动内容
 */
export default function SafeRichText({ html }: SafeRichTextProps) {
  const sanitizedHtml = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: [
      "style",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "button",
      "textarea",
      "select",
      "option",
    ],
  });

  return <div className="rich-text" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}

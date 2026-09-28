import "codemirror/lib/codemirror.css";
// 按需引入高亮模式，CodeMirror 5 的模式都在同一个包里，不必额外装语言包
// 注意：没有单独的 java 模式，Java 由 clike 模式承载（text/x-java）
import "codemirror/mode/clike/clike";
import "codemirror/mode/css/css";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/markdown/markdown";
import "codemirror/mode/properties/properties";
import "codemirror/mode/sql/sql";
import "codemirror/mode/vue/vue";
import "codemirror/mode/xml/xml";
import "codemirror/mode/yaml/yaml";

import { useEffect, useRef } from "react";
import CodeMirror from "codemirror";

interface CodeViewerProps {
  /** 代码内容 */
  value: string;
  /** 文件名，按扩展名推断高亮模式 */
  fileName?: string;
  /** 高度，缺省 100% */
  height?: string;
}

type EditorMode = CodeMirror.EditorConfiguration["mode"];

/** 按扩展名推断 CodeMirror 的高亮模式 */
function resolveMode(fileName?: string): EditorMode {
  const ext = fileName?.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "ts":
    case "tsx":
      return { name: "javascript", typescript: true };
    case "json":
      return { name: "javascript", json: true };
    case "js":
    case "jsx":
      return "javascript";
    case "vue":
      return "text/x-vue";
    case "html":
    case "htm":
      return "htmlmixed";
    case "xml":
      return "xml";
    case "css":
      return "css";
    case "scss":
      return "text/x-scss";
    case "less":
      return "text/x-less";
    case "java":
      return "text/x-java";
    case "sql":
      return "sql";
    case "yml":
    case "yaml":
      return "yaml";
    case "properties":
      return "properties";
    case "md":
      return "markdown";
    default:
      return "javascript";
  }
}

/** 只读代码查看器，只做预览，不提供编辑能力 */
export default function CodeViewer({ value, fileName, height = "100%" }: CodeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<CodeMirror.Editor | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const editor = CodeMirror(container, {
      value,
      mode: resolveMode(fileName),
      readOnly: true,
      lineNumbers: true,
    });
    editorRef.current = editor;

    // 面板宽高由分栏拖拽决定，容器变化后 CodeMirror 不会自己重算
    const observer = new ResizeObserver(() => editor.refresh());
    observer.observe(container);

    return () => {
      observer.disconnect();
      editorRef.current = null;
      // CodeMirror 5 会往容器里插自己的 DOM，卸载时清掉，避免 React 复用节点时残留旧内容
      container.querySelector(".CodeMirror")?.remove();
    };
    // 只在挂载时创建实例，内容与模式的后续变化交给下面的效果
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 切换文件或内容刷新时更新实例
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.setOption("mode", resolveMode(fileName));
    editor.setValue(value);
    editor.refresh();
  }, [fileName, value]);

  return <div ref={containerRef} className="code-viewer" style={{ height }} />;
}

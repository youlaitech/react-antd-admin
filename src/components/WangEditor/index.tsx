import "@wangeditor-next/editor/dist/css/style.css";

import { useEffect, useRef } from "react";
import {
  createEditor,
  createToolbar,
  type IDomEditor,
  type IEditorConfig,
} from "@wangeditor-next/editor";

import FileAPI from "@/api/file";

interface WangEditorProps {
  /** 编辑器内容（HTML） */
  value?: string;
  /** 内容变化 */
  onChange?: (html: string) => void;
  /** 编辑区高度，默认 500px */
  height?: string;
}

/** wangEditor 富文本编辑器；官方 React 绑定只声明到 React 18，这里按官方 API 自行创建与销毁实例 */
export default function WangEditor({ value = "", onChange, height = "500px" }: WangEditorProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<IDomEditor | null>(null);

  /** onChange 放 ref：父级每次渲染传的都是新函数，不能进创建效果的依赖 */
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  /** 初始内容同样只取首次，后续变化由下面的同步效果处理 */
  const initialHtmlRef = useRef(value);

  useEffect(() => {
    const container = containerRef.current;
    const toolbar = toolbarRef.current;
    if (!container || !toolbar) return;

    // MENU_CONF 在 wangEditor 里的类型是各菜单配置的联合，图片菜单未被单独导出，按官方文档的对象结构书写后整体断言
    const editorConfig = {
      placeholder: "请输入内容..",
      MENU_CONF: {
        uploadImage: {
          async customUpload(
            file: File,
            insertFn: (url: string, alt: string, href: string) => void
          ) {
            const data = await FileAPI.uploadFile(file);
            insertFn(data.url, data.name, data.url);
          },
        },
      },
    } as unknown as Partial<IEditorConfig>;

    const editor = createEditor({
      selector: container,
      html: initialHtmlRef.current,
      mode: "simple",
      config: editorConfig,
    });
    editorRef.current = editor;

    const handleChange = () => onChangeRef.current?.(editor.getHtml());
    editor.on("change", handleChange);

    createToolbar({ editor, selector: toolbar, mode: "simple" });

    return () => {
      editor.off("change", handleChange);
      editor.destroy();
      editorRef.current = null;
      // 开发模式下 React 会「挂载 → 卸载 → 再挂载」跑两遍效果，
      // 这里把两个容器清干净，避免工具栏或编辑区残留重复的一份
      toolbar.replaceChildren();
      container.replaceChildren();
    };
  }, []);

  // 外部值变化时回灌编辑器；内容一致就跳过，否则会把正在输入的光标顶到开头
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === editor.getHtml()) return;
    editor.setHtml(value);
  }, [value]);

  return (
    <div className="wang-editor">
      <div ref={toolbarRef} className="wang-editor__toolbar" />
      <div ref={containerRef} className="wang-editor__body" style={{ height }} />
    </div>
  );
}

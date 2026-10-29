import { useState } from "react";

import WangEditor from "@/components/WangEditor";

/**
 * wangEditor 富文本编辑器示例
 */
export default function WangEditorDemo() {
  const [value, setValue] = useState("初始化内容");

  return (
    <div className="page-container">
      <WangEditor value={value} onChange={setValue} height="400px" />

      <div className="mt-3">
        <textarea readOnly value={value} style={{ width: "100%", height: 200, outline: "none" }} />
      </div>
    </div>
  );
}

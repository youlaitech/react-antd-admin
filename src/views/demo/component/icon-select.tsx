import { useState } from "react";

import IconSelect from "@/components/IconSelect";

/**
 * 图标选择器示例
 */
export default function IconSelectDemo() {
  const [iconName, setIconName] = useState("api");

  return (
    <div className="page-container">
      <IconSelect value={iconName} onChange={setIconName} />
    </div>
  );
}

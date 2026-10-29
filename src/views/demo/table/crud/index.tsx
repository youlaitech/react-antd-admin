import { useEffect, useState } from "react";
import { Button } from "antd";
import { LinkOutlined } from "@ant-design/icons";

import { initOptions } from "./config/options";
import ExampleA from "./example-a";
import ExampleB from "./example-b";

/** 参考实现的源码地址 */
const SOURCE_URL =
  "https://gitee.com/youlaiorg/vue3-element-admin/tree/master/src/views/demo/table/crud";

/**
 * CRUD 封装示例
 */
export default function CrudDemo() {
  const [variant, setVariant] = useState<"a" | "b">("a");

  useEffect(() => {
    // 部门与角色下拉两个示例共用，放在父级加载一次
    initOptions();
  }, []);

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <Button type="link" size="small" href={SOURCE_URL} target="_blank" icon={<LinkOutlined />}>
          参考源码
        </Button>
        <Button
          type="primary"
          ghost
          shape="round"
          size="small"
          onClick={() => setVariant((prev) => (prev === "a" ? "b" : "a"))}
        >
          切换示例
        </Button>
      </div>

      {variant === "a" ? <ExampleA /> : <ExampleB />}
    </div>
  );
}

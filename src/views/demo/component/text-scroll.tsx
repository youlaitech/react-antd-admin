import { Card } from "antd";
import { useState } from "react";

import TextScroll from "@/components/TextScroll";

/** 演示用的六条配置 */
const DEMO_ITEMS = [
  { type: "default", typewriter: true, text: "这是一条基础的滚动公告，默认向左滚动" },
  { type: "success", typewriter: true, text: "这是一条成功类型的滚动公告" },
  { type: "warning", text: "这是一条警告类型的滚动公告" },
  { type: "danger", text: "这是一条危险类型的滚动公告" },
  { type: "info", text: "这是一条信息类型的滚动公告" },
  { type: "default", text: "这是一条速度较慢、向右滚动的公告", speed: 30, direction: "right" },
] as const;

/**
 * 文本滚动演示
 */
export default function TextScrollDemo() {
  const [closedKeys, setClosedKeys] = useState<number[]>([]);

  return (
    <div className="page-container">
      <Card className="page-content">
        <div className="flex flex-col gap-4">
          {DEMO_ITEMS.map((item, index) => {
            if (closedKeys.includes(index)) return null;

            return (
              <TextScroll
                key={index}
                text={item.text}
                type={item.type}
                typewriter={"typewriter" in item ? item.typewriter : false}
                speed={"speed" in item ? item.speed : undefined}
                direction={"direction" in item ? item.direction : undefined}
                showClose={index === DEMO_ITEMS.length - 1}
                onClose={() => setClosedKeys((prev) => [...prev, index])}
              />
            );
          })}
        </div>
      </Card>
    </div>
  );
}

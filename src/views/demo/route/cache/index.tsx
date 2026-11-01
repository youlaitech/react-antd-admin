import { useRef, useState } from "react";
import { Alert, Card, Col, Input, Row } from "antd";

/**
 * 组件实例标识
 */
function createInstanceId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/**
 * 页面缓存演示
 */
export default function RouteCache() {
  // 缓存观察用的输入内容
  const [inputText, setInputText] = useState("");

  const instanceIdRef = useRef(createInstanceId());
  // 计数在渲染期累加：缓存命中时组件不重渲染，该数字也就停住不动
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  const counters = [
    { label: "实例标识", value: instanceIdRef.current },
    { label: "渲染次数", value: String(renderCountRef.current) },
    { label: "已输入字符", value: String(inputText.length) },
  ];

  return (
    <div className="page-container">
      <Card className="page-content" variant="borderless" title="缓存对照实验">
        <Alert
          type="info"
          showIcon
          message="验证方式：在输入框写点内容 → 切到别的菜单再切回来"
          description="内容还在、且「实例标识」不变，说明页面被缓存（组件实例没有被销毁）；关掉顶部页签再进来，标识会换新、内容清空。"
        />

        <Input
          className="mt-4"
          value={inputText}
          placeholder="随便输入一点内容，用于观察缓存效果"
          onChange={(event) => setInputText(event.target.value)}
        />

        <Row className="mt-4" gutter={16}>
          {counters.map((item) => (
            <Col key={item.label} span={8}>
              <div className="flex items-center justify-between rounded-md bg-[var(--ant-color-fill-quaternary)] p-3">
                <span className="text-13px text-[var(--ant-color-text-secondary)]">
                  {item.label}
                </span>
                <span className="text-20px font-600 text-[var(--ant-color-primary)]">
                  {item.value}
                </span>
              </div>
            </Col>
          ))}
        </Row>

        <Alert
          className="mt-4"
          type="warning"
          showIcon
          title="React 侧的两点差异（与 Vue 版不同）"
          description="一、没有 onActivated / onDeactivated 这类激活钩子，所以用「实例标识 + 渲染次数」观察是否命中缓存；二、动画与缓存互斥，开启缓存的页面不参与页面切换动画。"
        />
      </Card>
    </div>
  );
}

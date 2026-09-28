import { useEffect, useRef, useState } from "react";
import { CloseOutlined } from "@ant-design/icons";

type TextScrollType = "default" | "success" | "warning" | "danger" | "info";

interface TextScrollProps {
  /** 滚动内容 */
  text: string;
  /** 滚动速度，数值越小越快 */
  speed?: number;
  /** 滚动方向 */
  direction?: "left" | "right";
  /** 主题类型 */
  type?: TextScrollType;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 打字机效果，逐字显示完再开始滚动 */
  typewriter?: boolean;
  /** 打字机每个字的间隔(毫秒) */
  typewriterSpeed?: number;
  /** 关闭回调 */
  onClose?: () => void;
}

/** 文本滚动 */
export default function TextScroll({
  text,
  speed = 70,
  direction = "left",
  type = "default",
  showClose = false,
  typewriter = false,
  typewriterSpeed = 100,
  onClose,
}: TextScrollProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [displayText, setDisplayText] = useState(typewriter ? "" : text);
  const [duration, setDuration] = useState(12);

  const typing = displayText.length < text.length;

  // 打字机：逐字追加，期间不滚动
  useEffect(() => {
    if (!typewriter) {
      setDisplayText(text);
      return;
    }

    setDisplayText("");
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setDisplayText(text.slice(0, index));
      if (index >= text.length) clearInterval(timer);
    }, typewriterSpeed);

    return () => clearInterval(timer);
  }, [text, typewriter, typewriterSpeed]);

  // 内容渲染了两份，取一半才是单份宽度
  useEffect(() => {
    if (typing) return;

    const element = contentRef.current;
    const singleWidth = element ? element.scrollWidth / 2 : 0;

    if (singleWidth > 0) {
      setDuration(Math.max(singleWidth / speed, 4));
    }
  }, [displayText, typing, speed]);

  const itemStyle = {
    animationDuration: `${duration}s`,
    animationDirection: direction === "right" ? ("reverse" as const) : ("normal" as const),
  };

  return (
    <div className={`text-scroll is-${type}`}>
      <div className="text-scroll__content" ref={contentRef}>
        <span className={`text-scroll__item${typing ? "" : " is-scrolling"}`} style={itemStyle}>
          {displayText}
          {typing && <i className="text-scroll__caret" />}
        </span>
        <span
          className={`text-scroll__item${typing ? "" : " is-scrolling"}`}
          style={itemStyle}
          aria-hidden
        >
          {displayText}
        </span>
      </div>

      {showClose && (
        <button type="button" className="text-scroll__close" onClick={onClose}>
          <CloseOutlined />
        </button>
      )}
    </div>
  );
}

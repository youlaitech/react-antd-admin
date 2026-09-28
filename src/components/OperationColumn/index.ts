import { useLayoutEffect, useState, type RefObject } from "react";

/** 操作列单元格内容的类名，测量时按它取所有行的操作区 */
export const OPERATION_ACTIONS_CLASS = "operation-actions";

/** 单元格左右内边距 */
const CELL_PADDING = 16;

/** 相邻按钮间距 */
const BUTTON_GAP = 8;

/**
 * 自适应操作列宽度
 * @param containerRef 表格外层容器，测量范围限定在其中，避免同页多个表格互相干扰
 * @param signature 内容标识，按钮增减或数据刷新时传入新值以触发重新测量
 */
export function useOperationColumnWidth(
  containerRef: RefObject<HTMLElement | null>,
  signature: string,
  minWidth = 80
) {
  const [width, setWidth] = useState(minWidth);

  useLayoutEffect(() => {
    const cells = containerRef.current?.querySelectorAll<HTMLElement>(
      `.${OPERATION_ACTIONS_CLASS}`
    );
    if (!cells?.length) {
      setWidth(minWidth);
      return;
    }

    let max = minWidth;
    cells.forEach((cell) => {
      const buttons = Array.from(cell.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement && child.offsetWidth > 0
      );
      if (!buttons.length) return;

      const total = buttons.reduce(
        (sum, button) => sum + button.offsetWidth + BUTTON_GAP,
        CELL_PADDING
      );
      max = Math.max(max, total);
    });
    setWidth(max);
  }, [containerRef, minWidth, signature]);

  return width;
}

import { useEffect, useRef } from "react";
import NavigatedViewer from "bpmn-js/lib/NavigatedViewer";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";

/** 画布服务调用子集 */
interface CanvasLike {
  zoom(scale: number | "fit-viewport"): number;
  addMarker(id: string, marker: string): void;
}

interface BpmnViewerProps {
  /** BPMN 2.0 XML */
  xml: string;
  /** 已办节点 ID 列表（走过路径高亮） */
  executedActivityIds?: string[];
  /** 进行中节点 ID 列表（当前待办高亮） */
  activeActivityIds?: string[];
}

/** BPMN 流程图查看器 */
export default function BpmnViewer({
  xml,
  executedActivityIds,
  activeActivityIds,
}: BpmnViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<NavigatedViewer | null>(null);

  // 高亮节点数组常常是父级即时构造的，直接进依赖会导致重复导入 XML，先压成字符串
  const executedKey = (executedActivityIds ?? []).join(",");
  const activeKey = (activeActivityIds ?? []).join(",");

  // 实例只创建一次，挂载后交由下方 effect 渲染
  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new NavigatedViewer({ container: containerRef.current });
    viewerRef.current = viewer;

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  // 导入 XML 并叠加高亮标记
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !xml) return;

    let cancelled = false;
    const canvas = viewer.get("canvas") as unknown as CanvasLike;
    const executedIds = executedKey ? executedKey.split(",") : [];
    const activeIds = activeKey ? activeKey.split(",") : [];

    viewer
      .importXML(xml)
      .then(() => {
        // 组件已卸载或 XML 已换新时不再叠加，避免标记落到错误的图上
        if (cancelled) return;

        canvas.zoom("fit-viewport");
        executedIds.forEach((id) => canvas.addMarker(id, "bpmn-viewer__executed"));
        activeIds.forEach((id) => canvas.addMarker(id, "bpmn-viewer__active"));
      })
      .catch((error) => {
        console.error("BPMN 流程图渲染失败:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [activeKey, executedKey, xml]);

  return <div ref={containerRef} className="bpmn-viewer" />;
}

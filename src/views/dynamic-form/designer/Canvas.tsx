import { useState, type DragEvent, type ReactNode } from "react";
import { Button, Divider, Empty, Space, Tooltip } from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  DownOutlined,
  HolderOutlined,
  UpOutlined,
} from "@ant-design/icons";

import { renderFormControl } from "@/components/FormRenderer/control";
import {
  FIELD_DRAG_TYPE,
  createRuleByPaletteType,
  duplicateRule,
  findRule,
  insertRelative,
  insertRule,
  isLayoutNode,
  moveRule,
  moveSibling,
  nextFieldKey,
  removeRule,
  type DesignerRule,
} from "./rule-model";

interface CanvasProps {
  /** 当前画布规则 */
  rules: DesignerRule[];
  /** 选中的节点标识 */
  selectedId?: string;
  /** 选中变化 */
  onSelect: (id?: string) => void;
  /** 规则变化 */
  onChange: (rules: DesignerRule[]) => void;
}

/** 落点位置：目标节点之前、之后，或放进目标容器 */
type DropPosition = "before" | "after" | "inside";

/** 设计器画布 */
export default function Canvas({ rules, selectedId, onSelect, onChange }: CanvasProps) {
  const [draggingId, setDraggingId] = useState<string>();
  const [dropHint, setDropHint] = useState<{ id: string; position: DropPosition }>();

  /** 清空拖拽状态 */
  function resetDrag() {
    setDraggingId(undefined);
    setDropHint(undefined);
  }

  /** 是否为字段面板拖入（而非移动画布内已有节点） */
  function isPaletteDrag(event: DragEvent) {
    return event.dataTransfer.types.includes(FIELD_DRAG_TYPE);
  }

  /** 计算落点 */
  function resolvePosition(
    event: DragEvent,
    node: DesignerRule,
    horizontal: boolean
  ): DropPosition {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = horizontal
      ? (event.clientX - rect.left) / Math.max(rect.width, 1)
      : (event.clientY - rect.top) / Math.max(rect.height, 1);

    if (isLayoutNode(node) && ratio > 0.25 && ratio < 0.75) return "inside";
    return ratio < 0.5 ? "before" : "after";
  }

  /** 节点操作栏 */
  function renderActions(node: DesignerRule) {
    return (
      <div className="designer-node__actions">
        <Tooltip title="拖动排序">
          <HolderOutlined className="designer-node__handle" />
        </Tooltip>
        <Tooltip title="上移">
          <Button
            type="text"
            size="small"
            icon={<UpOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              onChange(moveSibling(rules, node.__id, -1));
            }}
          />
        </Tooltip>
        <Tooltip title="下移">
          <Button
            type="text"
            size="small"
            icon={<DownOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              onChange(moveSibling(rules, node.__id, 1));
            }}
          />
        </Tooltip>
        <Tooltip title="复制">
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              onChange(duplicateRule(rules, node.__id));
            }}
          />
        </Tooltip>
        <Tooltip title="删除">
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              onChange(removeRule(rules, node.__id));
              if (selectedId === node.__id) onSelect(undefined);
            }}
          />
        </Tooltip>
      </div>
    );
  }

  /** 字段节点：标签 + 控件，控件禁用避免在设计态误输入 */
  function renderFieldBody(node: DesignerRule) {
    const required =
      Array.isArray(node.validate) && node.validate.some((item) => item?.required === true);

    return (
      <div className="designer-field">
        <div className="designer-field__label">
          {required && <span className="designer-field__required">*</span>}
          <span>{node.title}</span>
          <span className="designer-field__key">{node.field}</span>
        </div>
        <div className="designer-field__control">{renderFormControl(node, { disabled: true })}</div>
      </div>
    );
  }

  /** 容器节点：按类型铺开子节点，空容器给出可落点的占位 */
  function renderContainerBody(node: DesignerRule): ReactNode {
    const type = node.type;

    if (type === "divider") {
      return <Divider className="designer-node__divider">{node.title}</Divider>;
    }

    const children = node.children ?? [];
    const isRow = type === "row";

    const content =
      children.length > 0 ? (
        children.map((child) => renderNode(child, isRow))
      ) : (
        <div className="designer-node__placeholder">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="把左侧字段拖到这里"
            className="designer-node__placeholder-inner"
          />
        </div>
      );

    if (isRow) {
      return <div className="designer-row">{content}</div>;
    }

    return (
      <div className="designer-container">
        {node.title && <div className="designer-container__title">{node.title}</div>}
        {content}
      </div>
    );
  }

  /** 递归渲染节点 */
  function renderNode(node: DesignerRule, horizontal: boolean): ReactNode {
    const container = isLayoutNode(node);
    const hint = dropHint?.id === node.__id ? dropHint.position : undefined;

    const classNames = ["designer-node"];
    if (selectedId === node.__id) classNames.push("is-selected");
    if (container) classNames.push("designer-node--container");
    if (hint) classNames.push(`is-drop-${hint}`);

    return (
      <div
        key={node.__id}
        className={classNames.join(" ")}
        draggable
        onDragStart={(event) => {
          event.stopPropagation();
          setDraggingId(node.__id);
        }}
        onDragEnd={resetDrag}
        onDragOver={(event) => {
          const fromPalette = isPaletteDrag(event);
          if (!fromPalette && (!draggingId || draggingId === node.__id)) return;
          event.preventDefault();
          event.stopPropagation();
          setDropHint({ id: node.__id, position: resolvePosition(event, node, horizontal) });
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();

          const position = resolvePosition(event, node, horizontal);
          const paletteType = event.dataTransfer.getData(FIELD_DRAG_TYPE);

          if (paletteType) {
            // 面板拖入：新建节点插到落点
            const rule = createRuleByPaletteType(paletteType, nextFieldKey(rules, paletteType));
            onChange(insertRelative(rules, rule, node.__id, position));
          } else if (draggingId && draggingId !== node.__id) {
            onChange(moveRule(rules, draggingId, node.__id, position));
          }

          resetDrag();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(node.__id);
        }}
      >
        {renderActions(node)}
        <div className="designer-node__body">
          {container ? renderContainerBody(node) : renderFieldBody(node)}
        </div>
      </div>
    );
  }

  /** 落在画布空白处：面板拖入则追加到根级末尾，否则把节点移到根级末尾 */
  function handleRootDrop(event: DragEvent) {
    const paletteType = event.dataTransfer.getData(FIELD_DRAG_TYPE);

    if (paletteType) {
      event.preventDefault();
      const fieldKey = nextFieldKey(rules, paletteType);
      onChange(insertRule(rules, createRuleByPaletteType(paletteType, fieldKey), null));
      resetDrag();
      return;
    }

    if (!draggingId) return;
    event.preventDefault();

    const node = findRule(rules, draggingId);
    if (node) onChange(insertRule(removeRule(rules, draggingId), node, null));
    resetDrag();
  }

  return (
    <div
      className="designer-canvas"
      onClick={() => onSelect(undefined)}
      onDragOver={(event) => {
        if (draggingId || isPaletteDrag(event)) event.preventDefault();
      }}
      onDrop={handleRootDrop}
    >
      {rules.length === 0 ? (
        <div className="designer-canvas__empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="从左侧字段面板拖入字段，开始设计表单"
          />
        </div>
      ) : (
        <Space direction="vertical" size={12} className="designer-canvas__list">
          {rules.map((rule) => renderNode(rule, false))}
        </Space>
      )}
    </div>
  );
}

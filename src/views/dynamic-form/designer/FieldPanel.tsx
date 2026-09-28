import { Typography } from "antd";

import {
  FIELD_DRAG_TYPE,
  PALETTE,
  createRuleByPaletteType,
  insertRule,
  nextFieldKey,
  type DesignerRule,
} from "./rule-model";

interface FieldPanelProps {
  /** 当前画布规则，用于生成不冲突的字段名 */
  rules: DesignerRule[];
  /** 规则变化 */
  onChange: (rules: DesignerRule[]) => void;
}

/** 字段面板 */
export default function FieldPanel({ rules, onChange }: FieldPanelProps) {
  /** 追加到根级末尾 */
  function append(type: string) {
    const rule = createRuleByPaletteType(type, nextFieldKey(rules, type));
    onChange(insertRule(rules, rule, null));
  }

  return (
    <div className="designer-field-panel">
      {PALETTE.map((group) => (
        <div key={group.label} className="designer-field-panel__group">
          <Typography.Text type="secondary" className="designer-field-panel__title">
            {group.label}
          </Typography.Text>

          <div className="designer-field-panel__items">
            {group.items.map((item) => (
              <div
                key={item.type}
                className="designer-field-panel__item"
                title="拖到画布指定位置，或点击追加到末尾"
                draggable
                onDragStart={(event) => {
                  // 用自定义载体类型，画布据此区分新增与移动
                  event.dataTransfer.setData(FIELD_DRAG_TYPE, item.type);
                  event.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => append(item.type)}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

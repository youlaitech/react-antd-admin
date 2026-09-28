import {
  Button,
  Divider,
  Empty,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

import { normalizeType } from "@/components/FormRenderer/rule";
import {
  OPTION_TYPES,
  collectFieldKeys,
  isLayoutNode,
  updateRule,
  type DesignerRule,
} from "./rule-model";

interface PropertyPanelProps {
  /** 当前画布规则 */
  rules: DesignerRule[];
  /** 选中的节点，未选中时展示空态 */
  node?: DesignerRule;
  /** 规则变化 */
  onChange: (rules: DesignerRule[]) => void;
}

/** 属性行：固定宽度标签 + 控件 */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="designer-prop">
      <span className="designer-prop__label">{label}</span>
      <div className="designer-prop__control">{children}</div>
    </div>
  );
}

/** 属性面板 */
export default function PropertyPanel({ rules, node, onChange }: PropertyPanelProps) {
  if (!node) {
    return (
      <div className="designer-property designer-property--empty">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="在画布上选中一个节点" />
      </div>
    );
  }

  const type = normalizeType(node.type);
  const layout = isLayoutNode(node);
  const props = (node.props ?? {}) as Record<string, unknown>;

  /** 更新节点自身字段 */
  const patch = (values: Partial<DesignerRule>) => onChange(updateRule(rules, node.__id, values));
  /** 更新节点属性，浅合并 */
  const patchProps = (values: Record<string, unknown>) =>
    onChange(updateRule(rules, node.__id, { props: values }));

  // 字段名要与其它节点去重，重名提交时会互相覆盖
  const otherKeys = collectFieldKeys(rules).filter((key) => key !== node.field);
  const duplicated = Boolean(node.field) && otherKeys.includes(String(node.field));

  const options = node.options ?? [];
  const isCascader = type === "cascader";
  const showOptions = OPTION_TYPES.has(type) && !isCascader;

  const required = (node.validate ?? []).some((item) => item?.required === true);
  /** 只接管「必填」这一条规则，其余校验规则原样保留 */
  const setRequired = (checked: boolean) => {
    const rest = (node.validate ?? []).filter((item) => item?.required !== true);
    patch({
      validate: checked
        ? [{ required: true, message: `${node.title ?? "该字段"}不能为空` }, ...rest]
        : rest,
    });
  };

  /** 多行文本用 props.rows 表达，渲染器据此切换成 TextArea */
  const isTextarea = type === "input" && props.rows !== undefined;

  return (
    <div className="designer-property">
      <Typography.Text type="secondary" className="designer-property__type">
        {layout ? "布局容器" : `字段类型：${type}`}
      </Typography.Text>

      <Divider titlePlacement="start">基础</Divider>

      {type !== "divider" && (
        <Row label="标题">
          <Input
            value={node.title}
            placeholder="给节点起个名字"
            onChange={(event) => patch({ title: event.target.value })}
          />
        </Row>
      )}

      {type === "divider" && (
        <Row label="分割线文字">
          <Input
            value={node.title}
            placeholder="可留空"
            onChange={(event) => patch({ title: event.target.value })}
          />
        </Row>
      )}

      {!layout && (
        <>
          <Row label="字段名">
            <Input
              value={node.field}
              status={duplicated ? "error" : undefined}
              placeholder="提交时的键名"
              onChange={(event) => patch({ field: event.target.value })}
            />
          </Row>
          {duplicated && (
            <Typography.Text type="danger" className="designer-property__error">
              字段名与其它字段重复，提交时会互相覆盖
            </Typography.Text>
          )}
        </>
      )}

      {!layout && (
        <Row label="占位提示">
          <Input
            value={props.placeholder as string | undefined}
            placeholder="如 请输入姓名"
            onChange={(event) => patchProps({ placeholder: event.target.value })}
          />
        </Row>
      )}

      {!layout && (
        <Row label="说明文字">
          <Input
            value={node.info as string | undefined}
            placeholder="显示在控件下方"
            onChange={(event) => patch({ info: event.target.value })}
          />
        </Row>
      )}

      {!layout && (
        <Row label="隐藏">
          <Switch
            checked={node.hidden === true}
            onChange={(checked) => patch({ hidden: checked })}
          />
        </Row>
      )}

      {/* 各类型专属属性 */}
      {type === "input" && (
        <Row label="多行文本">
          <Switch
            checked={isTextarea}
            onChange={(checked) => patchProps({ rows: checked ? 3 : undefined })}
          />
        </Row>
      )}

      {type === "inputNumber" && (
        <Row label="取值范围">
          <Space>
            <InputNumber
              value={props.min as number | undefined}
              placeholder="最小"
              onChange={(value) => patchProps({ min: value })}
            />
            <InputNumber
              value={props.max as number | undefined}
              placeholder="最大"
              onChange={(value) => patchProps({ max: value })}
            />
          </Space>
        </Row>
      )}

      {type === "datePicker" && (
        <>
          <Row label="日期形态">
            <Select
              className="w-full"
              value={String(props.type ?? "date")}
              options={[
                { label: "日期", value: "date" },
                { label: "日期时间", value: "datetime" },
                { label: "日期区间", value: "daterange" },
              ]}
              onChange={(value) => patchProps({ type: value })}
            />
          </Row>
          <Row label="格式">
            <Input
              value={props.valueFormat as string | undefined}
              placeholder="YYYY-MM-DD"
              onChange={(event) => patchProps({ valueFormat: event.target.value })}
            />
          </Row>
        </>
      )}

      {type === "timePicker" && (
        <Row label="格式">
          <Input
            value={props.valueFormat as string | undefined}
            placeholder="HH:mm:ss"
            onChange={(event) => patchProps({ valueFormat: event.target.value })}
          />
        </Row>
      )}

      {type === "slider" && (
        <Row label="取值范围">
          <Space>
            <InputNumber
              value={props.min as number | undefined}
              placeholder="最小"
              onChange={(value) => patchProps({ min: value })}
            />
            <InputNumber
              value={props.max as number | undefined}
              placeholder="最大"
              onChange={(value) => patchProps({ max: value })}
            />
          </Space>
        </Row>
      )}

      {type === "rate" && (
        <Row label="总分">
          <InputNumber
            value={props.count as number | undefined}
            min={1}
            onChange={(value) => patchProps({ count: value })}
          />
        </Row>
      )}

      {type === "upload" && (
        <>
          <Row label="上传地址">
            <Input
              value={props.action as string | undefined}
              placeholder="接口地址，留空则为纯前端上传"
              onChange={(event) => patchProps({ action: event.target.value })}
            />
          </Row>
          <Row label="最大数量">
            <InputNumber
              value={props.limit as number | undefined}
              min={1}
              onChange={(value) => patchProps({ limit: value })}
            />
          </Row>
        </>
      )}

      {/* 选项编辑 */}
      {showOptions && (
        <>
          <Divider titlePlacement="start">选项</Divider>
          {options.map((option, index) => (
            <Row key={index} label={`选项 ${index + 1}`}>
              <Space className="w-full">
                <Input
                  value={option.label}
                  placeholder="显示文本"
                  onChange={(event) => {
                    const next = [...options];
                    next[index] = { ...option, label: event.target.value };
                    patch({ options: next });
                  }}
                />
                <Input
                  value={String(option.value)}
                  placeholder="提交值"
                  onChange={(event) => {
                    const next = [...options];
                    next[index] = { ...option, value: event.target.value };
                    patch({ options: next });
                  }}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => patch({ options: options.filter((_, i) => i !== index) })}
                />
              </Space>
            </Row>
          ))}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() =>
              patch({
                options: [
                  ...options,
                  { label: `选项${options.length + 1}`, value: String(options.length + 1) },
                ],
              })
            }
          >
            添加选项
          </Button>
        </>
      )}

      {/* 级联的选项是嵌套结构，用 JSON 编辑更直接 */}
      {isCascader && (
        <>
          <Divider titlePlacement="start">级联数据</Divider>
          <Input.TextArea
            rows={6}
            defaultValue={JSON.stringify(props.options ?? [], null, 2)}
            placeholder='[{"value":"a","label":"A","children":[]}]'
            onBlur={(event) => {
              try {
                patchProps({ options: JSON.parse(event.target.value || "[]") });
              } catch {
                // 非法 JSON 保持原值，用户继续修改
              }
            }}
          />
        </>
      )}

      {/* 校验 */}
      {!layout && (
        <>
          <Divider titlePlacement="start">校验</Divider>
          <Row label="必填">
            <Switch checked={required} onChange={setRequired} />
          </Row>
        </>
      )}

      {/* 布局属性 */}
      {type === "row" && (
        <>
          <Divider titlePlacement="start">布局</Divider>
          <Row label="列间距">
            <InputNumber
              value={(props.gutter as number | undefined) ?? 16}
              min={0}
              onChange={(value) => patchProps({ gutter: value })}
            />
          </Row>
        </>
      )}

      {type === "col" && (
        <>
          <Divider titlePlacement="start">布局</Divider>
          <Row label="栅格宽度">
            <Select
              className="w-full"
              value={node.span ?? 12}
              options={[
                { label: "1/4（6）", value: 6 },
                { label: "1/3（8）", value: 8 },
                { label: "1/2（12）", value: 12 },
                { label: "2/3（16）", value: 16 },
                { label: "3/4（18）", value: 18 },
                { label: "整行（24）", value: 24 },
              ]}
              onChange={(value) => patch({ span: value })}
            />
          </Row>
          <Typography.Text type="secondary" className="designer-property__tip">
            一行内所有列的栅格宽度加起来等于 24 才会占满整行
          </Typography.Text>
        </>
      )}
    </div>
  );
}

import { useEffect, useMemo, type ReactNode } from "react";
import { Button, Card, Col, Divider, Form, Input, Row, Space, Tag } from "antd";
import { useTranslation } from "react-i18next";

import { renderFormControl } from "./control";
import {
  buildInitialValues,
  isLayoutRule,
  normalizeType,
  readProp,
  toSubmitValue,
  toValidateRules,
} from "./rule";
import type { FormRenderOptions, FormRule } from "./types";

/** 只读值展示 */
function ReadonlyValue({ rule, value }: { rule: FormRule; value: unknown }) {
  const type = normalizeType(rule.type);
  const options = rule.options ?? [];

  if (value === undefined || value === null || value === "") return <span>-</span>;

  if (type === "switch") {
    const active = readProp<unknown>(rule, "activeValue") ?? true;
    return <span>{value === active ? "是" : "否"}</span>;
  }

  if (Array.isArray(value)) {
    return (
      <span>
        {value
          .map(
            (item) =>
              options.find((option) => String(option.value) === String(item))?.label ?? String(item)
          )
          .join("、")}
      </span>
    );
  }

  return (
    <span>
      {options.find((option) => String(option.value) === String(value))?.label ?? String(value)}
    </span>
  );
}

interface FormRendererProps {
  /** 表单标题 */
  title: string;
  /** 表单版本号，不传则不展示版本标签（草稿态预览） */
  version?: number;
  /** 表单规则 */
  rules: FormRule[];
  /** 全局配置 */
  options?: FormRenderOptions;
  /** 规则加载中 */
  loading?: boolean;
  /** 已提交成功，用 successSlot 替代表单区 */
  submitted?: boolean;
  /** 只读回显（表单数据详情） */
  readOnly?: boolean;
  /** 提交中 */
  submitting?: boolean;
  /** 外部带入的初始值（如编辑回显） */
  defaultValues?: Record<string, unknown>;
  /** 校验通过后的提交 */
  onFinish: (data: Record<string, unknown>) => void;
  /** 提交成功态内容 */
  successSlot?: ReactNode;
  /** 卡片头右侧附加内容 */
  headerExtra?: ReactNode;
}

/** 动态表单渲染器 */
export default function FormRenderer({
  title,
  version,
  rules,
  options = {},
  loading,
  submitted,
  readOnly,
  submitting,
  defaultValues,
  onFinish,
  successSlot,
  headerExtra,
}: FormRendererProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<Record<string, unknown>>();

  /** field -> 规则，提交时按类型做值转换 */
  const fieldRuleMap = useMemo(() => {
    const map = new Map<string, FormRule>();

    const walk = (list: FormRule[]) => {
      list.forEach((rule) => {
        if (rule.field) map.set(rule.field, rule);
        if (Array.isArray(rule.children)) walk(rule.children);
      });
    };

    walk(rules);
    return map;
  }, [rules]);

  /** 规则里的默认值与外部传入的初始值合并，外部优先 */
  const initialValues = useMemo(
    () => ({ ...buildInitialValues(rules), ...defaultValues }),
    [defaultValues, rules]
  );

  useEffect(() => {
    // 规则或外部初始值变化、以及从提交成功态回到填写态时，都重填一遍
    form.resetFields();
    form.setFieldsValue(initialValues);
  }, [form, initialValues, submitted]);

  /** 提交前把日期等值回收成字符串，与 form-create 的存储格式一致 */
  function handleFinish(values: Record<string, unknown>) {
    const payload: Record<string, unknown> = {};

    Object.entries(values).forEach(([field, value]) => {
      const rule = fieldRuleMap.get(field);
      payload[field] = rule ? toSubmitValue(normalizeType(rule.type), value, rule) : value;
    });

    onFinish(payload);
  }

  /** 渲染单个可编辑规则：布局容器递归展开，普通字段交给 Form.Item */
  function renderRule(rule: FormRule, index: number): ReactNode {
    const type = normalizeType(rule.type);
    const key = rule.field ?? `${type}-${index}`;

    if (rule.hidden === true || rule.display === false) {
      // antd 的 hidden 会保留表单项与取值，与 form-create 的语义一致
      return rule.field ? (
        <Form.Item key={key} name={rule.field} hidden>
          <Input />
        </Form.Item>
      ) : null;
    }

    if (type === "divider") {
      return <Divider key={key}>{rule.title}</Divider>;
    }

    if (isLayoutRule(rule)) {
      const children = (rule.children ?? []).map((child, childIndex) =>
        renderRule(child, childIndex)
      );

      if (type === "col") {
        return (
          <Col key={key} span={rule.span ?? readProp<number>(rule, "span") ?? 24}>
            {children}
          </Col>
        );
      }
      if (type === "row") {
        return (
          <Row key={key} gutter={readProp<number>(rule, "gutter") ?? 16}>
            {children}
          </Row>
        );
      }
      if (type === "card") {
        return (
          <Card key={key} size="small" title={rule.title} className="mb-4">
            {children}
          </Card>
        );
      }
      // div / group / template / tab 之类统一顺序铺开，面板标题退化成一条分割线
      return (
        <div key={key} className={rule.class}>
          {rule.title && <Divider titlePlacement="start">{rule.title}</Divider>}
          {children}
        </div>
      );
    }

    if (!rule.field) {
      // 没有字段名的静态内容（纯展示文案）
      return rule.title ? <Divider key={key}>{rule.title}</Divider> : null;
    }

    return (
      <Form.Item
        key={key}
        name={rule.field}
        label={rule.title}
        rules={toValidateRules(rule)}
        extra={readProp<string>(rule, "info")}
        valuePropName={type === "switch" ? "checked" : "value"}
      >
        {renderFormControl(rule, { uploadText: t("common.upload") })}
      </Form.Item>
    );
  }

  /** 只读回显：按规则顺序把值铺出来，隐藏字段不出现 */
  function renderReadonly(list: FormRule[]): ReactNode {
    const nodes: ReactNode[] = [];

    const walk = (items: FormRule[]) => {
      items.forEach((rule, index) => {
        const type = normalizeType(rule.type);

        if (rule.hidden === true || rule.display === false) return;

        if (isLayoutRule(rule)) {
          if (rule.title && (type === "div" || type === "card")) {
            nodes.push(<Divider key={`${type}-${index}`}>{rule.title}</Divider>);
          }
          walk(rule.children ?? []);
          return;
        }

        if (!rule.field) return;
        // 只读分支的 Form.Item 不挂 name，值不会进表单 store，
        // 去 form.getFieldValue 取只会拿到 undefined，这里直接读初始值
        nodes.push(
          <Form.Item key={rule.field} label={rule.title}>
            <ReadonlyValue rule={rule} value={initialValues[rule.field]} />
          </Form.Item>
        );
      });
    };

    walk(list);
    return nodes;
  }

  return (
    <div className="form-renderer">
      <Card className="form-renderer__card" variant="borderless" loading={loading}>
        {/* 标题为空时不渲染头部，供内嵌回显场景（工作流表单详情）复用同一渲染器 */}
        {(title || version || headerExtra) && (
          <div className="form-renderer__header">
            <span className="form-renderer__title">{title}</span>
            <Space>
              {version ? <Tag>{`v${version}`}</Tag> : null}
              {headerExtra}
            </Space>
          </div>
        )}

        {submitted ? (
          successSlot
        ) : (
          <Form
            form={form}
            layout={options.labelPosition === "top" ? "vertical" : "horizontal"}
            labelCol={options.labelPosition === "top" ? undefined : { span: 6 }}
            wrapperCol={options.labelPosition === "top" ? undefined : { span: 16 }}
            initialValues={initialValues}
            onFinish={handleFinish}
          >
            {readOnly ? renderReadonly(rules) : rules.map(renderRule)}

            {!readOnly && (options.submitBtn ?? true) && (
              <Form.Item wrapperCol={options.labelPosition === "top" ? undefined : { offset: 6 }}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={submitting}>
                    {options.submitBtnText ?? t("common.submit")}
                  </Button>
                  {options.resetBtn && (
                    <Button onClick={() => form.resetFields()}>
                      {options.resetBtnText ?? t("common.reset")}
                    </Button>
                  )}
                </Space>
              </Form.Item>
            )}
          </Form>
        )}
      </Card>
    </div>
  );
}

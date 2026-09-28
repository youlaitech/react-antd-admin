import type { ReactNode } from "react";
import {
  Button,
  Cascader,
  Checkbox,
  ColorPicker,
  DatePicker,
  Input,
  InputNumber,
  Radio,
  Rate,
  Select,
  Slider,
  Switch,
  TimePicker,
  TreeSelect,
  Upload,
} from "antd";

import { normalizeType, readProp } from "./rule";
import type { FormRule } from "./types";

interface RenderControlOptions {
  /** 只读态：控件禁用并展示原值 */
  readOnly?: boolean;
  /** 额外禁用 */
  disabled?: boolean;
  /** 占位文案，缺省按规则或「请输入」 */
  placeholder?: string;
  /** 上传按钮文案 */
  uploadText?: string;
}

/** 按规则渲染表单控件 */
export function renderFormControl(rule: FormRule, options: RenderControlOptions = {}): ReactNode {
  const type = normalizeType(rule.type);
  // datePicker 的 type 是原件属性，透传会把 antd 的控件搞混，先摘出来
  const { type: nativeType, ...props } = (rule.props ?? {}) as Record<string, unknown>;
  const disabled = options.readOnly || options.disabled || rule.disabled;
  const placeholder = options.placeholder ?? readProp<string>(rule, "placeholder") ?? "请输入";

  switch (type) {
    case "inputNumber":
      return (
        <InputNumber className="w-full" disabled={disabled} placeholder={placeholder} {...props} />
      );
    case "select":
      return (
        <Select
          allowClear
          disabled={disabled}
          options={rule.options}
          placeholder={placeholder}
          {...props}
        />
      );
    case "radio":
      return <Radio.Group disabled={disabled} options={rule.options} {...props} />;
    case "checkbox":
      return <Checkbox.Group disabled={disabled} options={rule.options} {...props} />;
    case "switch":
      return <Switch disabled={disabled} {...props} />;
    case "slider":
      return <Slider disabled={disabled} {...props} />;
    case "rate":
      return <Rate disabled={disabled} {...props} />;
    case "colorPicker":
      return <ColorPicker disabled={disabled} {...props} />;
    case "cascader":
      return (
        <Cascader
          allowClear
          disabled={disabled}
          placeholder={placeholder}
          options={props.options as never}
          {...props}
        />
      );
    case "treeSelect":
      return (
        <TreeSelect
          allowClear
          showSearch
          treeDefaultExpandAll
          treeNodeFilterProp="label"
          disabled={disabled}
          placeholder={placeholder}
          treeData={rule.options}
          {...props}
        />
      );
    case "datePicker":
      if (String(nativeType ?? "") === "daterange") {
        return <DatePicker.RangePicker className="w-full" disabled={disabled} {...props} />;
      }
      return (
        <DatePicker
          className="w-full"
          disabled={disabled}
          placeholder={placeholder}
          showTime={String(nativeType ?? "") === "datetime"}
          {...props}
        />
      );
    case "timePicker":
      return (
        <TimePicker className="w-full" disabled={disabled} placeholder={placeholder} {...props} />
      );
    case "inputTag":
      return (
        <Select
          mode="tags"
          disabled={disabled}
          placeholder={placeholder}
          open={false}
          suffixIcon={null}
          {...props}
        />
      );
    case "upload":
      return (
        <Upload disabled={disabled} {...props}>
          <Button disabled={disabled}>{options.uploadText ?? "上传"}</Button>
        </Upload>
      );
    default:
      // 同一个 input 类型配合 type: textarea 表示多行文本
      if (nativeType === "textarea" || props.rows !== undefined) {
        return <Input.TextArea disabled={disabled} placeholder={placeholder} {...props} />;
      }
      return <Input allowClear disabled={disabled} placeholder={placeholder} {...props} />;
  }
}

import { useState } from "react";
import {
  Button,
  Card,
  Cascader,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  TimePicker,
  Tooltip,
  TreeSelect,
} from "antd";
import {
  DownOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  UpOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import IconSelect from "@/components/IconSelect";
import type { CrudRecord, CrudSearchConfig, CrudSearchFormItem } from "./types";

interface CrudSearchProps {
  /** 搜索区配置 */
  config?: CrudSearchConfig;
  /** 是否展示，缺省展示 */
  visible?: boolean;
  /**
   * 查询回调，已把日期转成字符串
   */
  onQuery: (values: CrudRecord) => void;
  /**
   * 重置回调
   */
  onReset: (values: CrudRecord) => void;
}

/**
 * 把表单值里的 Dayjs 转成字符串
 */
function normalizeValues(values: CrudRecord): CrudRecord {
  const result: CrudRecord = {};

  Object.entries(values).forEach(([key, value]) => {
    if (dayjs.isDayjs(value)) {
      result[key] = value.format("YYYY-MM-DD");
    } else if (Array.isArray(value) && value.every((item) => dayjs.isDayjs(item))) {
      result[key] = value.map((item) => item.format("YYYY-MM-DD"));
    } else {
      result[key] = value;
    }
  });

  return result;
}

/**
 * 配置驱动的搜索区
 */
export default function CrudSearch({ config, visible = true, onQuery, onReset }: CrudSearchProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<CrudRecord>();
  const [expanded, setExpanded] = useState(false);

  if (!config) return null;

  const formItems = config.formItems ?? [];
  const isExpandable = config.isExpandable ?? true;
  const showNumber = isExpandable ? (config.showNumber ?? 3) : formItems.length;
  const needCollapse = isExpandable && formItems.length > showNumber;

  function handleQuery() {
    onQuery(normalizeValues(form.getFieldsValue()));
  }

  function handleReset() {
    form.resetFields();
    // 重置后表单里只剩各字段的 initialValue
    onReset(normalizeValues(form.getFieldsValue()));
  }

  /**
   * 按类型渲染控件
   */
  function renderControl(item: CrudSearchFormItem) {
    const attrs = item.attrs ?? {};

    if (item.type === "custom") {
      return item.render?.(undefined, () => undefined);
    }

    if (item.type === "select") {
      return (
        <Select
          allowClear
          placeholder={t("common.pleaseSelect")}
          options={item.options}
          {...attrs}
        />
      );
    }

    if (item.type === "tree-select") {
      return (
        <TreeSelect
          allowClear
          showSearch
          treeDefaultExpandAll
          treeNodeFilterProp="label"
          treeData={item.treeData}
          placeholder={t("common.pleaseSelect")}
          {...attrs}
        />
      );
    }

    if (item.type === "date-picker") {
      return <DatePicker {...attrs} />;
    }

    if (item.type === "date-range-picker") {
      return <DatePicker.RangePicker {...attrs} />;
    }

    if (item.type === "time-picker") {
      return <TimePicker {...attrs} />;
    }

    // antd 没有「固定时间点下拉」，用限定步长的 TimePicker 达到同样的选择粒度
    if (item.type === "time-select") {
      return <TimePicker format="HH:mm" minuteStep={30} showNow={false} {...attrs} />;
    }

    if (item.type === "icon-select") {
      return <IconSelect {...attrs} />;
    }

    if (item.type === "cascader") {
      return (
        <Cascader
          allowClear
          options={item.cascaderOptions}
          placeholder={t("common.pleaseSelect")}
          {...attrs}
        />
      );
    }

    if (item.type === "input-tag") {
      return (
        <Select
          mode="tags"
          allowClear
          placeholder={t("common.pleaseSelect")}
          open={false}
          suffixIcon={null}
          {...attrs}
        />
      );
    }

    if (item.type === "input-number") {
      return <InputNumber className="w-full" {...attrs} />;
    }

    if (item.type === "radio") {
      return <Radio.Group options={item.options} optionType="button" {...attrs} />;
    }

    if (item.type === "checkbox") {
      return <Checkbox.Group options={item.options} {...attrs} />;
    }

    return (
      <Input
        allowClear
        placeholder={t("common.pleaseInput")}
        onPressEnter={handleQuery}
        {...attrs}
      />
    );
  }

  return (
    <Card className={visible ? "crud-search" : "crud-search hidden"} variant="borderless">
      <Form form={form} layout="inline" className="crud-search__form">
        {formItems.map((item, index) => {
          if (item.hidden) return null;
          if (needCollapse && !expanded && index >= showNumber) return null;

          return (
            <Form.Item
              key={item.prop}
              name={item.prop}
              label={
                <span className="crud-search__label">
                  {item.label}
                  {item.tips && (
                    <Tooltip title={item.tips}>
                      <QuestionCircleOutlined className="crud-search__tip-icon" />
                    </Tooltip>
                  )}
                </span>
              }
              initialValue={item.initialValue}
            >
              {renderControl(item)}
            </Form.Item>
          );
        })}

        <Form.Item className="crud-search__actions">
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleQuery}>
              {t("common.search")}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              {t("common.reset")}
            </Button>
            {needCollapse && (
              <Button
                type="link"
                onClick={() => setExpanded((prev) => !prev)}
                icon={expanded ? <UpOutlined /> : <DownOutlined />}
              >
                {expanded ? t("common.collapse") : t("common.expand")}
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}

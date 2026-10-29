import { useState } from "react";
import { Card, Form, Select, Space, Table, Tag } from "antd";
import { useTranslation } from "react-i18next";

import { useDict } from "@/hooks/useDict";
import DictSelect from "@/components/DictSelect";
import type { DictItemOption } from "@/api/system/dict";
import { toTagColor } from "@/utils/dict";

/** 可选字典编码 */
const DICT_CODES = ["notice_type", "notice_level", "not_exist"];

/**
 * 字典演示
 */
export default function Dictionary() {
  const { t } = useTranslation();
  const [code, setCode] = useState(DICT_CODES[0]);
  const options = useDict(code);

  // 同一个字典编码的三种绑定值写法
  const [stringValue, setStringValue] = useState<string>("1");
  const [numberValue, setNumberValue] = useState<number | string>(1);
  const [arrayValue, setArrayValue] = useState<Array<string | number>>(["1", "2"]);

  const columns = [
    { title: t("demo.dict.label"), dataIndex: "label" },
    { title: t("demo.dict.value"), dataIndex: "value" },
    {
      title: t("demo.dict.preview"),
      dataIndex: "tagType",
      render: (tagType: string, record: DictItemOption) =>
        tagType ? (
          <Tag color={toTagColor(tagType)}>{record.label}</Tag>
        ) : (
          <span>{record.label}</span>
        ),
    },
  ];

  return (
    <div className="page-container">
      <Card className="page-content" variant="borderless">
        <Form labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
          <Form.Item label={t("demo.dict.stringValue")}>
            <Space wrap>
              <DictSelect
                code="gender"
                value={stringValue}
                onChange={(value) => setStringValue(value as string)}
              />
              <code className="demo-dict__value">{`const value = "${stringValue}"`}</code>
            </Space>
          </Form.Item>

          <Form.Item label={t("demo.dict.numberValue")}>
            <Space wrap>
              <DictSelect
                code="gender"
                value={numberValue}
                onChange={(value) => setNumberValue(value as number)}
              />
              <code className="demo-dict__value">{`const value = ${String(numberValue)}`}</code>
            </Space>
          </Form.Item>

          <Form.Item label={t("demo.dict.radioValue")}>
            <Space wrap>
              <DictSelect
                code="gender"
                type="radio"
                value={numberValue}
                onChange={(value) => setNumberValue(value as number)}
              />
              <code className="demo-dict__value">{`const value = ${String(numberValue)}`}</code>
            </Space>
          </Form.Item>

          <Form.Item label={t("demo.dict.checkboxValue")}>
            <Space wrap>
              <DictSelect
                code="gender"
                type="checkbox"
                value={arrayValue}
                onChange={(value) => setArrayValue(value as Array<string | number>)}
              />
              <code className="demo-dict__value">{`const value = ${JSON.stringify(arrayValue)}`}</code>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card className="page-content mt-4" variant="borderless">
        <Space className="mb-4" wrap>
          <span>{t("demo.dict.code")}</span>
          <Select
            className="w-200px"
            value={code}
            options={DICT_CODES.map((item) => ({ value: item, label: item }))}
            onChange={setCode}
          />
        </Space>

        <Table<DictItemOption>
          rowKey="value"
          size="small"
          columns={columns}
          dataSource={options}
          pagination={false}
          locale={{ emptyText: t("demo.dict.empty") }}
        />
      </Card>
    </div>
  );
}

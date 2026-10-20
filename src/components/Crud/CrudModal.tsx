import {
  Button,
  Cascader,
  Checkbox,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  TimePicker,
  Tooltip,
  TreeSelect,
} from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd";
import { useTranslation } from "react-i18next";

import IconSelect from "@/components/IconSelect";
import type { CrudFormItem, CrudModalConfig, CrudRecord } from "./types";

interface CrudModalProps<T extends object> {
  /** 弹窗配置 */
  config: CrudModalConfig<T>;
  /** 表单实例，由 useCrudPage 持有 */
  form: FormInstance<CrudRecord>;
  /** 是否打开 */
  open: boolean;
  /** 是否为编辑态 */
  isEdit: boolean;
  /** 提交中 */
  submitting: boolean;
  /** 关闭 */
  onClose: () => void;
  /** 提交 */
  onSubmit: () => void;
}

/** 配置驱动的表单弹窗 */
export default function CrudModal<T extends object>({
  config,
  form,
  open,
  isEdit,
  submitting,
  onClose,
  onSubmit,
}: CrudModalProps<T>) {
  const { t } = useTranslation();

  const isDrawer = config.component === "drawer";
  const column = config.column ?? 1;
  const colSpan = column > 1 ? Math.floor(24 / column) : 24;

  /** 按类型渲染表单项控件 */
  function renderControl(item: CrudFormItem) {
    if (item.render) return item.render;

    const disabled = item.disabled;
    const attrs = item.attrs ?? {};

    switch (item.type) {
      case "select":
        return (
          <Select
            allowClear
            options={item.options}
            placeholder={item.placeholder ?? t("common.pleaseSelect")}
            disabled={disabled}
            {...attrs}
          />
        );
      case "tree-select":
        return (
          <TreeSelect
            allowClear
            showSearch
            treeDefaultExpandAll
            treeNodeFilterProp="label"
            placeholder={item.placeholder ?? t("common.pleaseSelect")}
            disabled={disabled}
            {...attrs}
          />
        );
      case "date-picker":
        return <DatePicker className="w-full" disabled={disabled} {...attrs} />;
      case "date-range-picker":
        return <DatePicker.RangePicker className="w-full" disabled={disabled} {...attrs} />;
      case "time-picker":
        return <TimePicker className="w-full" disabled={disabled} {...attrs} />;
      // antd 没有「固定时间点下拉」，用限定步长的 TimePicker 达到同样的选择粒度
      case "time-select":
        return (
          <TimePicker
            className="w-full"
            format="HH:mm"
            minuteStep={30}
            showNow={false}
            disabled={disabled}
            {...attrs}
          />
        );
      case "cascader":
        return (
          <Cascader
            allowClear
            options={item.cascaderOptions}
            placeholder={item.placeholder ?? t("common.pleaseSelect")}
            disabled={disabled}
            {...attrs}
          />
        );
      case "input-number":
        return <InputNumber className="w-full" disabled={disabled} {...attrs} />;
      case "switch":
        return <Switch disabled={disabled} {...attrs} />;
      case "radio":
        return <Radio.Group disabled={disabled} options={item.options} {...attrs} />;
      case "checkbox":
        return <Checkbox.Group disabled={disabled} options={item.options} {...attrs} />;
      case "input-tag":
        // antd 的 tags 模式自带「输入后回车成标签」，与 el-input-tag 能力一致
        return (
          <Select
            mode="tags"
            allowClear
            open={false}
            suffixIcon={null}
            placeholder={item.placeholder ?? t("common.pleaseInput")}
            disabled={disabled}
            {...attrs}
          />
        );
      case "icon-select":
        return <IconSelect {...attrs} />;
      default:
        return (
          <Input
            allowClear
            disabled={disabled}
            placeholder={item.placeholder ?? t("common.pleaseInput")}
            {...attrs}
          />
        );
    }
  }

  const formNode = (
    <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 17 }} className="crud-modal__form">
      <Row gutter={16}>
        {config.formItems.map((item) => (
          <Col span={colSpan} key={item.prop}>
            <Form.Item
              name={item.prop}
              label={
                item.tip ? (
                  <Space size={4}>
                    {item.label}
                    <Tooltip title={item.tip}>
                      <QuestionCircleOutlined className="crud-modal__tip-icon" />
                    </Tooltip>
                  </Space>
                ) : (
                  item.label
                )
              }
              valuePropName={item.type === "switch" ? "checked" : "value"}
              rules={
                item.rules ??
                (item.required ? [{ required: true, message: t("common.required") }] : undefined)
              }
            >
              {renderControl(item)}
            </Form.Item>
          </Col>
        ))}
      </Row>
    </Form>
  );

  const title = t(isEdit ? "crud.editTitle" : "crud.createTitle", {
    title: config.title ?? "",
  });

  const footer = (
    <Space>
      <Button onClick={onClose}>{t("common.cancel")}</Button>
      <Button type="primary" loading={submitting} onClick={onSubmit}>
        {t("common.confirm")}
      </Button>
    </Space>
  );

  if (isDrawer) {
    return (
      <Drawer
        size={config.width ?? 600}
        open={open}
        title={title}
        footer={<div className="crud-modal__footer">{footer}</div>}
        onClose={onClose}
        destroyOnHidden
      >
        {formNode}
      </Drawer>
    );
  }

  return (
    <Modal
      width={config.width ?? 640}
      open={open}
      title={title}
      footer={footer}
      confirmLoading={submitting}
      onCancel={onClose}
      destroyOnHidden
    >
      {formNode}
    </Modal>
  );
}

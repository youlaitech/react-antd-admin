import { useCallback, useEffect, useState, type Key, type ReactNode } from "react";
import {
  App as AntdApp,
  Button,
  DatePicker,
  Form,
  Input,
  Pagination,
  Popover,
  Select,
  Space,
  Table,
  TreeSelect,
  type TableProps,
  type TreeSelectProps,
} from "antd";
import { DownOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

/** 表单项定义 */
export interface TableSelectFormItem {
  /** 控件类型 */
  type?: "input" | "select" | "tree-select" | "date-picker";
  /** 标签文本 */
  label: string;
  /** 字段名 */
  prop: string;
  /** 初始值 */
  initialValue?: unknown;
  /** select 的选项 */
  options?: Array<{ label: string; value: string | number }>;
  /** tree-select 的树数据 */
  treeData?: TreeSelectProps["treeData"];
  /** 控件宽度 */
  width?: number;
}

/** 表格列定义 */
export interface TableSelectColumn<T> {
  /** 列标题 */
  label?: string;
  /** 字段名 */
  prop?: string;
  /** 列宽 */
  width?: number;
  /** 对齐方式 */
  align?: "left" | "center" | "right";
  /** 自定义单元格渲染 */
  render?: (record: T) => ReactNode;
}

/** 列表选择器配置 */
export interface TableSelectConfig<T> {
  /** 外层宽度，缺省 100% */
  width?: string;
  /** 输入框占位文案 */
  placeholder?: string;
  /** 数据主键，缺省 id */
  pk?: string;
  /** 是否多选 */
  multiple?: boolean;
  /** 查询条件表单项 */
  formItems: TableSelectFormItem[];
  /** 表格列 */
  tableColumns: Array<TableSelectColumn<T>>;
  /**
   * 列表数据查询
   */
  indexAction: (params: Record<string, unknown>) => Promise<{ list?: T[]; total?: number }>;
}

interface TableSelectProps<T> {
  /** 选择器配置 */
  config: TableSelectConfig<T>;
  /** 输入框展示文本 */
  text?: string;
  /**
   * 确认选择回调
   */
  onConfirm: (selection: T[]) => void;
  /** 外层类名 */
  className?: string;
}

/**
 * 把表单值里的 Dayjs 转成字符串
 */
function normalizeParams(values: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

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

/** 列表选择器 */
export default function TableSelect<T extends object>({
  config,
  text = "",
  onConfirm,
  className,
}: TableSelectProps<T>) {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();

  const [searchForm] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [queryParams, setQueryParams] = useState<
    Record<string, unknown> & { pageNum: number; pageSize: number }
  >({
    pageNum: 1,
    pageSize: 10,
  });
  const [initialized, setInitialized] = useState(false);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);

  const pk = config.pk ?? "id";

  // 拉取分页数据
  const fetchList = useCallback(
    async (params: Record<string, unknown> & { pageNum: number; pageSize: number }) => {
      setLoading(true);
      try {
        const data = await config.indexAction(params);
        setList(data.list ?? []);
        setTotal(data.total ?? 0);
      } finally {
        setLoading(false);
      }
    },
    [config]
  );

  useEffect(() => {
    if (!open || initialized) return;

    // 首次展开时才请求，避免把列表请求浪费在没打开的选择器上
    setInitialized(true);
    fetchList(queryParams);
  }, [fetchList, initialized, open, queryParams]);

  /**
   * 组装查询条件：表单项 + 分页
   */
  function buildParams(overrides: Record<string, unknown> = {}) {
    return {
      ...normalizeParams(searchForm.getFieldsValue()),
      pageNum: 1,
      pageSize: queryParams.pageSize,
      ...overrides,
    };
  }

  function handleSearch() {
    const params = buildParams();
    setQueryParams(params);
    fetchList(params);
  }

  function handleReset() {
    searchForm.resetFields();
    const params = buildParams();
    setQueryParams(params);
    fetchList(params);
  }

  function handlePageChange(pageNum: number, pageSize: number) {
    const params = { ...queryParams, pageNum, pageSize };
    setQueryParams(params);
    fetchList(params);
  }

  function handleConfirm() {
    if (selectedRows.length === 0) {
      message.error(t("common.selectRequired"));
      return;
    }
    setOpen(false);
    onConfirm(selectedRows);
  }

  function handleClear() {
    setSelectedRows([]);
  }

  const columns: TableProps<T>["columns"] = config.tableColumns.map((column, index) => ({
    key: column.prop ?? `column-${index}`,
    dataIndex: column.prop,
    title: column.label,
    width: column.width,
    align: column.align,
    ellipsis: true,
    render: column.render ? (_, record) => column.render?.(record) : undefined,
  }));

  /**
   * 查询条件控件
   */
  function renderFormItem(item: TableSelectFormItem) {
    const style = item.width ? { width: item.width } : undefined;

    if (item.type === "select") {
      return (
        <Select
          style={style}
          allowClear
          placeholder={t("common.pleaseSelect")}
          options={item.options}
        />
      );
    }

    if (item.type === "tree-select") {
      return (
        <TreeSelect
          style={style}
          allowClear
          showSearch
          treeDefaultExpandAll
          treeNodeFilterProp="label"
          treeData={item.treeData}
          placeholder={t("common.pleaseSelect")}
        />
      );
    }

    if (item.type === "date-picker") {
      return <DatePicker.RangePicker style={style} />;
    }

    return <Input style={style} allowClear onPressEnter={handleSearch} />;
  }

  const content = (
    <div className="table-select" style={{ width: config.width ?? "100%" }}>
      <Form form={searchForm} layout="inline" className="table-select__form">
        {config.formItems.map((item) => (
          <Form.Item
            key={item.prop}
            name={item.prop}
            label={item.label}
            initialValue={item.initialValue}
          >
            {renderFormItem(item)}
          </Form.Item>
        ))}
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              {t("common.search")}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              {t("common.reset")}
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table<T>
        rowKey={pk}
        size="small"
        loading={loading}
        columns={columns}
        dataSource={list}
        scroll={{ x: 800, y: 250 }}
        pagination={false}
        rowSelection={{
          type: config.multiple ? "checkbox" : "radio",
          selectedRowKeys: selectedRows.map((row) => (row as Record<string, unknown>)[pk] as Key),
          onChange: (_, rows) => setSelectedRows(rows),
        }}
      />

      {total > 0 && (
        <div className="table-select__pagination">
          <Pagination
            size="small"
            current={queryParams.pageNum}
            pageSize={queryParams.pageSize}
            total={total}
            showSizeChanger={false}
            onChange={handlePageChange}
          />
        </div>
      )}

      <div className="table-select__footer">
        <Space size={8}>
          <Button type="primary" size="small" onClick={handleConfirm}>
            {selectedRows.length > 0
              ? t("common.selectedCount", { count: selectedRows.length })
              : t("common.pleaseSelect")}
          </Button>
          <Button size="small" onClick={handleClear}>
            {t("common.clear")}
          </Button>
          <Button size="small" onClick={() => setOpen(false)}>
            {t("common.close")}
          </Button>
        </Space>
      </div>
    </div>
  );

  return (
    <div className={className} style={{ width: config.width ?? "100%" }}>
      <Popover
        open={open}
        trigger="click"
        placement="bottomLeft"
        content={content}
        onOpenChange={setOpen}
      >
        <Input
          readOnly
          className="table-select__trigger"
          value={text}
          placeholder={config.placeholder ?? t("common.pleaseSelect")}
          suffix={<DownOutlined />}
        />
      </Popover>
    </div>
  );
}

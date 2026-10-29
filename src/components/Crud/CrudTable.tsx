import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Checkbox,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Pagination,
  Popover,
  Radio,
  Space,
  Switch,
  Table,
  Upload,
  type TableProps,
} from "antd";
import type { FilterValue } from "antd/es/table/interface";
import {
  DeleteOutlined,
  DownloadOutlined,
  FilterOutlined,
  InboxOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import Auth from "@/components/Auth";
import MenuIcon from "@/components/MenuIcon";
import { downloadFile } from "@/utils/download";
import { exportExcel, parseExcel } from "@/utils/excel";
import { validateForm } from "@/utils/form";
import type {
  CrudColumn,
  CrudQueryParams,
  CrudRecord,
  CrudSearchConfig,
  CrudTableConfig,
  CrudToolbarButton,
} from "./types";
import CrudSearch from "./CrudSearch";

interface CrudTableProps<T extends object, Q extends CrudQueryParams> {
  /** 表格配置 */
  config: CrudTableConfig<T, Q>;
  /** 搜索区配置，透传给 CrudSearch */
  searchConfig?: CrudSearchConfig;
  /** 加载状态 */
  loading: boolean;
  /** 当前页数据 */
  list: T[];
  /** 数据总条数 */
  total: number;
  /** 当前页码 */
  pageNum: number;
  /** 每页条数 */
  pageSize: number;
  /** 勾选的行 */
  selectedRows: T[];
  /**
   * 分页变化
   */
  onPageChange: (pageNum: number, pageSize: number) => void;
  /**
   * 勾选变化
   */
  onSelectionChange: (rows: T[]) => void;
  /**
   * 工具栏点击
   */
  onToolbar: (name: string) => void;
  /**
   * 行内操作点击
   */
  onOperate: (name: string, row: T) => void;
  /**
   * 搜索
   */
  onQuery: (values: CrudRecord) => void;
  /**
   * 重置搜索
   */
  onReset: (values: CrudRecord) => void;
  /**
   * 表头筛选变化，参数是拼好的查询条件
   */
  onFilterChange: (filters: CrudRecord) => void;
  /**
   * 刷新
   */
  refresh: () => void;
  /** 自定义工具栏点击 */
  onToolbarClick?: (name: string) => void;
  /** 工具栏左侧附加内容，排在按钮之前，如页面标题与标识 */
  toolbarExtra?: ReactNode;
  /** 工具栏右侧附加内容，排在图标按钮之前 */
  toolbarExtraRight?: ReactNode;
}

/** 导出弹窗的表单值 */
interface ExportFormValues {
  /** 文件名 */
  filename: string;
  /** 工作表名 */
  sheetname: string;
  /** 数据来源 */
  origin: "remote" | "selected" | "page";
  /** 选中的导出字段 */
  fields: string[];
}

/** 内置工具栏按钮的文案与权限 */
const TOOLBAR_PRESET = {
  add: { labelKey: "common.create", perm: "create" },
  view: { labelKey: "common.view", perm: "update" },
  delete: { labelKey: "common.delete", perm: "delete" },
  import: { labelKey: "common.import", perm: "import" },
  export: { labelKey: "common.export", perm: "export" },
  refresh: { labelKey: "common.refresh", perm: "*:*:*" },
  filter: { labelKey: "crud.filterColumns", perm: "*:*:*" },
  imports: { labelKey: "crud.imports", perm: "imports" },
  exports: { labelKey: "crud.exports", perm: "exports" },
  search: { labelKey: "common.search", perm: "list" },
} as const;

/** 工具栏图标：内置按钮统一用同一个映射，避免各调用点各写一套 */
const TOOLBAR_ICON = {
  add: <PlusOutlined />,
  delete: <DeleteOutlined />,
  import: <UploadOutlined />,
  export: <DownloadOutlined />,
  refresh: <ReloadOutlined />,
  imports: <UploadOutlined />,
  exports: <DownloadOutlined />,
  search: <SearchOutlined />,
} as const;

/** 生成列的唯一标识 */
function colKey<T extends object>(col: CrudColumn<T>, index: number) {
  return col.prop ?? col.label ?? String(index);
}

interface CellInputProps {
  /** 当前值 */
  value: unknown;
  /** 输入类型 */
  type?: "text" | "number";
  /**
   * 失焦或回车后提交
   */
  onCommit: (value: unknown) => void;
}

/**
 * 单元格里的输入框
 */
function CellInput({ value, type, onCommit }: CellInputProps) {
  const [draft, setDraft] = useState(String(value ?? ""));

  useEffect(() => {
    setDraft(String(value ?? ""));
  }, [value]);

  function commit() {
    if (draft === String(value ?? "")) return;
    onCommit(type === "number" ? Number(draft) : draft);
  }

  return (
    <Input
      size="small"
      type={type ?? "text"}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onPressEnter={commit}
    />
  );
}

/** 配置驱动的表格区 */
export default function CrudTable<T extends object, Q extends CrudQueryParams>({
  config,
  searchConfig,
  loading,
  list,
  total,
  pageNum,
  pageSize,
  selectedRows,
  onPageChange,
  onSelectionChange,
  onToolbar,
  onOperate,
  onQuery,
  onReset,
  onFilterChange,
  refresh,
  onToolbarClick,
  toolbarExtra,
  toolbarExtraRight,
}: CrudTableProps<T, Q>) {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();

  const pk = config.pk ?? "id";
  const showPagination = config.pagination !== false;

  // 列显隐：以配置里的 show 为初始值，之后由「筛选列」面板接管
  const [hiddenCols, setHiddenCols] = useState<Record<string, boolean>>({});
  // 搜索区显隐，由右侧「搜索」工具按钮切换
  const [searchVisible, setSearchVisible] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File>();
  const [importing, setImporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportForm] = Form.useForm<ExportFormValues>();

  const toolbar = config.toolbar ?? ["add", "delete"];
  const defaultToolbar = config.defaultToolbar ?? ["refresh", "filter"];

  useEffect(() => {
    // 配置里显式 show: false 的列默认不展示
    const initial: Record<string, boolean> = {};
    config.cols.forEach((col, index) => {
      if (col.show === false) initial[colKey(col, index)] = true;
    });
    setHiddenCols(initial);
  }, [config.cols]);

  /**
   * 解析按钮配置：字符串用内置预设，对象用配置项
   */
  function resolveButton(item: string | CrudToolbarButton) {
    if (typeof item === "string") {
      const preset = TOOLBAR_PRESET[item as keyof typeof TOOLBAR_PRESET];
      return {
        name: item,
        text: preset ? t(preset.labelKey) : item,
        danger: item === "delete",
        primary: item === "add",
        loading: false,
        perm: preset?.perm,
      };
    }

    return {
      name: item.name,
      text: item.text ?? item.name,
      danger: item.danger ?? item.name === "delete",
      primary: item.primary ?? false,
      loading: item.loading ?? false,
      perm: item.perm,
    };
  }

  /**
   * 拼权限标识：已含冒号的视为完整标识
   */
  function resolvePerm(perm?: string | string[]) {
    if (!perm) return "*:*:*";
    const value = Array.isArray(perm) ? perm[0] : perm;
    if (value.includes(":")) return value;
    return config.permPrefix ? `${config.permPrefix}:${value}` : "*:*:*";
  }

  /**
   * 行内修改，交给 modifyAction
   */
  async function handleModify(field: string, value: unknown, row: T) {
    if (!config.modifyAction) {
      message.error(t("crud.noModifyAction"));
      return;
    }
    await config.modifyAction({ [pk]: (row as CrudRecord)[pk], field, value });
    message.success(t("common.saveSuccess"));
    refresh();
  }

  // 可导出的列：要有表头与字段名，序号列、勾选列不参与
  const exportableCols = useMemo(
    () =>
      config.cols.filter(
        (col) => col.label && col.prop && col.type !== "selection" && col.type !== "index"
      ),
    [config.cols]
  );

  /**
   * 打开导出弹窗：按当前勾选情况预选数据来源，字段默认全选
   */
  function openExportDialog() {
    exportForm.setFieldsValue({
      // 权限前缀里带冒号（如 sys:user），直接当文件名会被系统拒绝
      filename: (config.permPrefix ?? "export").replace(/:/g, "-"),
      sheetname: "sheet",
      origin: selectedRows.length ? "selected" : "page",
      fields: exportableCols.map((col) => col.prop as string),
    });
    setExportOpen(true);
  }

  /**
   * 导出
   */
  async function handleExportSubmit() {
    const values = await validateForm(exportForm);
    if (!values) return;

    const columns = exportableCols
      .filter((col) => values.fields.includes(col.prop as string))
      .map((col) => ({ header: col.label as string, key: col.prop as string }));

    const params = { ...(showPagination ? { pageNum, pageSize } : {}) } as Q;

    setExporting(true);
    try {
      let rows: CrudRecord[];

      if (values.origin === "remote") {
        if (config.exportsAction) {
          rows = await config.exportsAction(params);
        } else if (config.exportAction) {
          // 后端直接产出文件，前端不再二次加工
          downloadFile(await config.exportAction(params));
          setExportOpen(false);
          return;
        } else {
          message.error(t("crud.noExportAction"));
          return;
        }
      } else if (values.origin === "selected") {
        rows = selectedRows as unknown as CrudRecord[];
      } else {
        rows = list as unknown as CrudRecord[];
      }

      if (!rows.length) {
        message.warning(t("crud.exportEmpty"));
        return;
      }

      await exportExcel({
        filename: values.filename,
        sheetname: values.sheetname,
        columns,
        rows,
      });
      message.success(t("crud.exportSuccess", { count: rows.length }));
      setExportOpen(false);
    } finally {
      setExporting(false);
    }
  }

  /**
   * 下载导入模板
   */
  async function handleDownloadTemplate() {
    const template = config.importTemplate;
    if (!template) return;

    if (typeof template === "string") {
      window.open(template);
      return;
    }
    downloadFile(await template());
  }

  /**
   * 提交导入
   * 否则把文件整体上传由后端解析
   */
  async function handleImport() {
    const { importAction, importsAction } = config;
    if (!importAction && !importsAction) {
      message.error(t("crud.noImportAction"));
      return;
    }
    if (!importFile) {
      message.warning(t("system.user.importFileRequired"));
      return;
    }

    setImporting(true);
    try {
      if (importsAction) {
        let rows: CrudRecord[];
        try {
          rows = await parseExcel(importFile);
        } catch {
          message.error(t("crud.importParseFailed"));
          return;
        }
        if (!rows.length) {
          message.error(t("crud.importEmpty"));
          return;
        }
        await importsAction(rows);
      } else {
        await importAction?.(importFile);
      }

      message.success(t("crud.importSuccess"));
      setImportOpen(false);
      setImportFile(undefined);
      refresh();
    } finally {
      setImporting(false);
    }
  }

  /**
   * 工具栏点击：内置项直接处理，其余回抛
   */
  function handleToolbarClick(item: string | CrudToolbarButton) {
    const name = typeof item === "string" ? item : item.name;

    if (name === "import") {
      setImportOpen(true);
      return;
    }
    if (name === "export") {
      openExportDialog();
      return;
    }
    if (name === "refresh") {
      refresh();
      return;
    }
    // 批量导入与模板导出走的是同一个弹窗，区别只在于配了 importsAction 就由前端解析
    if (name === "imports") {
      setImportOpen(true);
      return;
    }
    if (name === "exports") {
      openExportDialog();
      return;
    }
    if (name === "search") {
      setSearchVisible((prev) => !prev);
      return;
    }
    if (["add", "delete"].includes(name)) {
      onToolbar(name);
      return;
    }
    onToolbarClick?.(name);
  }

  /**
   * 表头筛选变化
   */
  function handleFilterChange(filters: Record<string, FilterValue | null>) {
    const params: CrudRecord = {};

    Object.entries(filters).forEach(([key, values]) => {
      const col = config.cols.find(
        (item, index) => (item.filterKey ?? item.prop ?? colKey(item, index)) === key
      );

      if (!values || values.length === 0) {
        params[key] = undefined;
        return;
      }
      params[key] = col?.filterJoin ? values.join(col.filterJoin) : values;
    });

    onFilterChange(params);
  }

  /**
   * 列渲染：按 templet 分派
   */
  function renderCell(col: CrudColumn<T>, row: T) {
    if (col.render) return col.render(row);

    const value = col.prop ? (row as CrudRecord)[col.prop] : undefined;

    switch (col.templet) {
      case "image": {
        const urls = Array.isArray(value) ? (value as string[]) : value ? [String(value)] : [];
        if (urls.length === 0) return null;
        return (
          <Space size={4}>
            {urls.map((url) => (
              <Image key={url} src={url} width={40} height={40} className="crud-image" />
            ))}
          </Space>
        );
      }
      case "list":
        return (col.selectList ?? {})[String(value)] ?? String(value ?? "");
      case "url":
        return value ? (
          <a href={String(value)} target="_blank" rel="noreferrer">
            {String(value)}
          </a>
        ) : null;
      case "switch":
        return (
          <Switch
            size="small"
            checked={value === (col.activeValue ?? 1)}
            checkedChildren={col.activeText}
            unCheckedChildren={col.inactiveText}
            onChange={(checked) =>
              handleModify(
                col.prop as string,
                checked ? (col.activeValue ?? 1) : (col.inactiveValue ?? 0),
                row
              )
            }
          />
        );
      case "input":
        return (
          <CellInput
            value={value}
            type={col.inputType}
            onCommit={(next) => handleModify(col.prop as string, next, row)}
          />
        );
      case "price":
        return `${col.priceFormat ?? ""}${value ?? ""}`;
      case "percent":
        return `${value ?? ""}%`;
      case "icon":
        // 图标是本地 SVG 名或 antd 图标名，交给 MenuIcon 统一解析
        return value ? <MenuIcon icon={String(value)} /> : null;
      case "date":
        return value ? dayjs(value as string).format(col.dateFormat ?? "YYYY-MM-DD HH:mm:ss") : "";
      case "tool":
        return (
          <Space size={0}>
            {(col.operat ?? ["edit", "delete"]).map((item) => {
              const btn = resolveButton(item);
              if (typeof item !== "string" && item.render && !item.render(row as CrudRecord))
                return null;

              return (
                <Auth key={btn.name} perm={resolvePerm(btn.perm)}>
                  <Button
                    type="link"
                    size="small"
                    danger={btn.danger}
                    // 行内操作带上行数据回抛，编辑与删除由封装消化，其余交给 onOperate
                    onClick={() => onOperate(btn.name, row)}
                  >
                    {typeof btn.text === "string" ? btn.text : btn.text(row as CrudRecord)}
                  </Button>
                </Auth>
              );
            })}
          </Space>
        );
      default:
        return value === undefined || value === null || value === "" ? "" : String(value);
    }
  }

  const columns: TableProps<T>["columns"] = useMemo(() => {
    const result: NonNullable<TableProps<T>["columns"]> = [];

    config.cols.forEach((col, index) => {
      if (hiddenCols[colKey(col, index)]) return;

      if (col.type === "selection") return;
      if (col.type === "index") {
        result.push({
          key: "index",
          title: col.label ?? t("common.index"),
          width: col.width ?? 60,
          align: col.align ?? "center",
          render: (_, __, rowIndex) => rowIndex + 1,
        });
        return;
      }

      // 配了筛选的列用筛选字段名当 key：antd 用 key 关联表头筛选项，
      // 这样列上显示角色名、筛选项里传角色 ID 也能对上
      const columnKey = col.filters?.length
        ? (col.filterKey ?? col.prop ?? colKey(col, index))
        : (col.prop ?? colKey(col, index));

      result.push({
        key: columnKey,
        dataIndex: col.prop,
        title: col.label,
        width: col.width,
        align: col.align,
        fixed: col.fixed,
        ellipsis: !col.templet,
        filters: col.filters,
        filterMultiple: col.filterMultiple ?? true,
        // 模板列（如操作列的 templet: "tool"）没有 prop 也没有 render，
        // 漏掉 templet 会让这类列挂不上 render，整列渲染成空白
        render:
          col.prop || col.render || col.templet ? (_, row) => renderCell(col, row) : undefined,
      });
    });

    return result;
    // renderCell 依赖 config，随 config 一起重算
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.cols, hiddenCols, t]);

  const hasSelection = config.cols.some((col) => col.type === "selection");

  return (
    <>
      {/*
        搜索区与表格区是并列的两块卡片，搜索区不套在表格卡片里；
        显隐用样式收起而不是卸载，否则「搜索」按钮一按就把已填的查询条件清空了
      */}
      <CrudSearch
        config={searchConfig}
        visible={searchVisible}
        onQuery={onQuery}
        onReset={onReset}
      />

      <Card className="crud-table" variant="borderless">
        <div className="crud-table__toolbar">
          <Space wrap>
            {toolbarExtra}
            {toolbar.map((item) => {
              const btn = resolveButton(item);
              const disabled = btn.name === "delete" && selectedRows.length === 0;

              return (
                <Auth key={btn.name} perm={resolvePerm(btn.perm)}>
                  <Button
                    type={btn.primary ? "primary" : "default"}
                    danger={btn.danger}
                    disabled={disabled}
                    loading={btn.loading}
                    icon={TOOLBAR_ICON[btn.name as keyof typeof TOOLBAR_ICON]}
                    onClick={() => handleToolbarClick(item)}
                  >
                    {typeof btn.text === "string" ? btn.text : btn.name}
                  </Button>
                </Auth>
              );
            })}
          </Space>

          <Space wrap>
            {toolbarExtraRight}
            {defaultToolbar.map((item) => {
              const btn = resolveButton(item);

              if (btn.name === "filter") {
                return (
                  <Popover
                    key={btn.name}
                    trigger="click"
                    placement="bottomRight"
                    content={
                      <div className="crud-table__filter">
                        {config.cols
                          .filter(
                            (col) => col.prop && col.type !== "selection" && col.type !== "index"
                          )
                          .map((col, index) => {
                            const key = colKey(col, index);
                            return (
                              <Checkbox
                                key={key}
                                checked={!hiddenCols[key]}
                                onChange={(event) =>
                                  setHiddenCols((prev) => ({
                                    ...prev,
                                    [key]: !event.target.checked,
                                  }))
                                }
                              >
                                {col.label}
                              </Checkbox>
                            );
                          })}
                      </div>
                    }
                  >
                    <Button
                      icon={<FilterOutlined />}
                      title={typeof btn.text === "string" ? btn.text : btn.name}
                    />
                  </Popover>
                );
              }

              return (
                <Auth key={btn.name} perm={resolvePerm(btn.perm)}>
                  <Button
                    icon={TOOLBAR_ICON[btn.name as keyof typeof TOOLBAR_ICON]}
                    title={typeof btn.text === "string" ? btn.text : btn.name}
                    onClick={() => handleToolbarClick(item)}
                  />
                </Auth>
              );
            })}
          </Space>
        </div>

        <Table<T>
          rowKey={pk}
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={list}
          scroll={{ x: config.scrollX ?? 1200 }}
          pagination={false}
          onChange={(_, filters) => handleFilterChange(filters)}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          rowSelection={
            hasSelection
              ? {
                  selectedRowKeys: selectedRows.map((row) => (row as CrudRecord)[pk] as string),
                  preserveSelectedRowKeys: true,
                  onChange: (_, rows) => onSelectionChange(rows),
                }
              : undefined
          }
        />

        {showPagination && (
          <div className="crud-table__pagination">
            <Pagination
              current={pageNum}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              pageSizeOptions={[10, 20, 30, 50]}
              showTotal={(count) => t("common.total", { total: count })}
              onChange={onPageChange}
            />
          </div>
        )}

        <Modal
          title={t("common.import")}
          width={600}
          centered
          open={importOpen}
          confirmLoading={importing}
          okButtonProps={{ disabled: !importFile }}
          onOk={handleImport}
          onCancel={() => {
            setImportOpen(false);
            setImportFile(undefined);
          }}
          destroyOnHidden
        >
          <Upload.Dragger
            maxCount={1}
            accept=".xlsx,.xls"
            fileList={importFile ? [{ uid: "-1", name: importFile.name }] : []}
            beforeUpload={(file) => {
              setImportFile(file);
              return false;
            }}
            onRemove={() => setImportFile(undefined)}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">{t("system.user.uploadTip")}</p>
          </Upload.Dragger>

          {config.importTemplate && (
            <div className="crud-table__import-tip">
              *.xlsx / *.xls
              <Button type="link" size="small" onClick={handleDownloadTemplate}>
                {t("system.user.downloadTemplate")}
              </Button>
            </div>
          )}

          {config.importsAction && (
            <div className="crud-table__import-tip">{t("crud.importHeaderTip")}</div>
          )}
        </Modal>

        <Modal
          title={t("crud.exportTitle")}
          width={560}
          centered
          open={exportOpen}
          confirmLoading={exporting}
          okText={t("crud.exported")}
          onOk={handleExportSubmit}
          onCancel={() => setExportOpen(false)}
          destroyOnHidden
        >
          <Form form={exportForm} labelCol={{ span: 5 }} className="pt-4">
            <Form.Item
              name="filename"
              label={t("crud.exportFilename")}
              rules={[{ required: true, message: t("common.required") }]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="sheetname" label={t("crud.exportSheetname")}>
              <Input />
            </Form.Item>

            <Form.Item name="origin" label={t("crud.exportOrigin")}>
              <Radio.Group
                options={[
                  { value: "remote", label: t("crud.originRemote") },
                  { value: "selected", label: t("crud.originSelected") },
                  { value: "page", label: t("crud.originPage") },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="fields"
              label={t("crud.exportFields")}
              rules={[{ required: true, message: t("crud.exportFieldsRequired") }]}
            >
              <Checkbox.Group
                options={exportableCols.map((col) => ({
                  value: col.prop as string,
                  label: col.label,
                }))}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </>
  );
}

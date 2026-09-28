import { useCallback, useEffect, useMemo, useState } from "react";
import { App as AntdApp, Button, Descriptions, Drawer, Space, Tag, Tooltip } from "antd";
import { DownloadOutlined, FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";

import FormAPI from "@/api/form";
import type { FormDataItem, FormDataQueryParams } from "@/api/form";
import Auth from "@/components/Auth";
import { CrudTable, useCrudPage } from "@/components/Crud";
import type { CrudColumn, CrudTableConfig } from "@/components/Crud";
import FormRenderer from "@/components/FormRenderer";
import type { FormRule } from "@/components/FormRenderer/types";
import { parseRules } from "@/components/FormRenderer/rule";
import { useFullscreen } from "@/hooks/useFullscreen";
import { exportExcel } from "@/utils/excel";
import {
  extractFields,
  formatCellValue,
  parseDataJson,
  type FormFieldMeta,
} from "@/utils/form-field";

/** 动态列上限：超出部分在详情里查看，避免表格横向溢出 */
const MAX_FIELD_COLUMNS = 6;

/** 导出时每页拉取的条数 */
const EXPORT_PAGE_SIZE = 500;

/** 导出页数上限，超出只导出已拉取的部分并提示 */
const EXPORT_MAX_PAGES = 100;

/** 表单数据列表页 */
export default function FormDataPage() {
  const { message } = AntdApp.useApp();
  const [searchParams] = useSearchParams();

  const formKey = searchParams.get("formKey") ?? "";
  const title = searchParams.get("title") ?? "表单数据";

  /** 表单名称，用于详情标题 */
  const [formName, setFormName] = useState("");
  /** 从表单规则提取的字段元数据 */
  const [fields, setFields] = useState<FormFieldMeta[]>([]);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  /** 当前查看的数据行 */
  const [detailRow, setDetailRow] = useState<FormDataItem>();
  /** 详情用的规则快照与提交值 */
  const [detailRules, setDetailRules] = useState<FormRule[]>([]);
  const [detailValues, setDetailValues] = useState<Record<string, unknown>>({});
  const [detailOpen, setDetailOpen] = useState(false);
  /** 导出进行中，防止重复触发分页拉取 */
  const [exporting, setExporting] = useState(false);

  /** 导出全量数据为 Excel */
  async function handleExport() {
    if (exporting) return;
    if (!fields.length) {
      message.warning("表单字段尚未加载完成，请稍后再试");
      return;
    }

    setExporting(true);
    try {
      const rows: FormDataItem[] = [];
      let total = 0;

      for (let pageNum = 1; pageNum <= EXPORT_MAX_PAGES; pageNum++) {
        const page = await FormAPI.getFormDataPage(formKey, {
          pageNum,
          pageSize: EXPORT_PAGE_SIZE,
        });
        total = page.total;
        rows.push(...page.list);
        if (rows.length >= total) break;
      }

      if (!rows.length) {
        message.warning("暂无数据可导出");
        return;
      }
      if (rows.length < total) {
        message.warning(`数据量超出导出上限，仅导出前 ${rows.length} 条`);
      }

      await exportExcel({
        filename: `${formName || formKey}-数据`,
        sheetname: "表单数据",
        columns: [
          ...fields.map((field) => ({ header: field.title, key: field.field })),
          { header: "提交人", key: "createByName" },
          { header: "版本", key: "formVersion" },
          { header: "提交时间", key: "createTime" },
        ],
        rows: rows.map((row) => {
          const data = parseDataJson(row.dataJson);
          const record: Record<string, unknown> = {};
          fields.forEach((field) => {
            record[field.field] = formatCellValue(data[field.field], field);
          });
          record.createByName = row.createByName || "匿名";
          record.formVersion = row.formVersion;
          record.createTime = row.createTime;
          return record;
        }),
      });

      message.success(`成功导出 ${rows.length} 条数据`);
    } catch {
      // 分页拉取失败时业务异常已由请求拦截器统一提示，这里只需收尾
    } finally {
      setExporting(false);
    }
  }

  // 先拉表单规则提取动态列，表格列依赖字段元数据
  useEffect(() => {
    if (!formKey) return;

    FormAPI.getRender(formKey).then((renderData) => {
      setFormName(renderData.formName ?? formKey);
      setFields(extractFields(parseRules(renderData.formJson)));
    });
  }, [formKey]);

  /** 打开详情：优先用提交时版本的规则快照，避免表单改版后历史数据错位 */
  const openDetail = useCallback(
    async (row: FormDataItem) => {
      const detail = await FormAPI.getFormDataDetail(formKey, row.id);
      setDetailRow(detail);
      setDetailValues(parseDataJson(detail.dataJson));
      setDetailRules(parseRules(detail.formJson));
      setDetailOpen(true);
    },
    [formKey]
  );

  const tableConfig: CrudTableConfig<FormDataItem, FormDataQueryParams> = useMemo(() => {
    // 动态字段列 + 提交人/版本/时间 + 操作列
    const fieldColumns: Array<CrudColumn<FormDataItem>> = fields
      .slice(0, MAX_FIELD_COLUMNS)
      .map((field) => ({
        label: field.title,
        prop: field.field,
        width: 140,
        render: (row) => formatCellValue(parseDataJson(row.dataJson)[field.field], field),
      }));

    return {
      permPrefix: "form",
      pk: "id",
      toolbar: ["delete"],
      defaultToolbar: ["refresh"],
      cols: [
        { type: "selection", width: 55, align: "center" },
        ...fieldColumns,
        {
          label: "提交人",
          prop: "createByName",
          width: 120,
          align: "center",
          render: (row) => row.createByName || "匿名",
        },
        { label: "版本", prop: "formVersion", width: 70, align: "center" },
        { label: "提交时间", prop: "createTime", width: 170, align: "center" },
        {
          label: "操作",
          align: "center",
          width: 140,
          templet: "tool",
          operat: [{ name: "detail", text: "详情" }, "delete"],
        },
      ],
      indexAction: (params) => FormAPI.getFormDataPage(formKey, params),
      deleteAction: (ids) => FormAPI.deleteFormData(formKey, ids),
    };
  }, [fields, formKey]);

  const crud = useCrudPage<FormDataItem, FormDataQueryParams>({
    table: tableConfig,
    initialParams: {},
    onOperate: (name, row) => {
      if (name === "detail") {
        openDetail(row).catch(() => message.error("数据详情加载失败"));
      }
    },
  });

  if (!formKey) {
    return (
      <div className="page-container">
        <CrudTable<FormDataItem, FormDataQueryParams>
          {...crud.tableProps}
          toolbarExtra={<span className="data-toolbar__title">缺少表单标识参数</span>}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <CrudTable<FormDataItem, FormDataQueryParams>
        {...crud.tableProps}
        toolbarExtra={
          <Space>
            <span className="data-toolbar__title">{title}</span>
            <Tag variant="outlined">{formKey}</Tag>
          </Space>
        }
        toolbarExtraRight={
          <Space>
            <Auth perm="form:data:export">
              <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>
                导出
              </Button>
            </Auth>
            <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
              <Button
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
              />
            </Tooltip>
          </Space>
        }
      />

      <Drawer
        width={560}
        open={detailOpen}
        title="数据详情"
        onClose={() => setDetailOpen(false)}
        destroyOnHidden
      >
        {detailRow && (
          <Descriptions
            className="data-detail__desc"
            column={2}
            bordered
            size="small"
            items={[
              { key: "creator", label: "提交人", children: detailRow.createByName || "匿名" },
              { key: "time", label: "提交时间", children: detailRow.createTime },
              { key: "version", label: "表单版本", children: `v${detailRow.formVersion}` },
            ]}
          />
        )}

        <FormRenderer
          title={formName}
          rules={detailRules}
          defaultValues={detailValues}
          readOnly
          onFinish={() => undefined}
        />
      </Drawer>
    </div>
  );
}

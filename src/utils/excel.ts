import type { CellValue } from "exceljs";

import { downloadFile } from "./download";

/** Excel 列：表头与取值键 */
export interface ExcelColumn {
  /** 表头文本 */
  header: string;
  /** 取值键，对应行对象的属性名 */
  key: string;
  /** 列宽，不给则按表头长度自适应 */
  width?: number;
}

export interface ExcelExportOptions {
  /** 文件名，不含扩展名 */
  filename: string;
  /** 工作表名，缺省 sheet */
  sheetname?: string;
  /** 列定义 */
  columns: ExcelColumn[];
  /** 行数据 */
  rows: Record<string, unknown>[];
}

/** 单元格值里的富文本片段 */
interface RichTextFragment {
  text: string;
}

/**
 * 归一化单元格取值
 */
function normalizeCellValue(value: CellValue): unknown {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value;
  if (typeof value !== "object") return value;

  const cellObject = value as {
    text?: string;
    result?: unknown;
    richText?: RichTextFragment[];
  };
  // 超链接：取显示文本而不是链接地址
  if (typeof cellObject.text === "string") return cellObject.text;
  // 公式：取计算结果
  if ("result" in cellObject) return cellObject.result;
  // 富文本：把片段拼回纯文本
  if (cellObject.richText) return cellObject.richText.map((item) => item.text).join("");

  return "";
}

/**
 * 导出 Excel
 */
export async function exportExcel(options: ExcelExportOptions): Promise<void> {
  const { filename, sheetname = "sheet", columns, rows } = options;
  if (!rows.length) throw new Error("no-data");

  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetname);
  worksheet.columns = columns;

  // 中文表头较长，按字数估宽并设下限，避免中文列被压得读不出来
  worksheet.columns.forEach((column) => {
    if (column.width) return;
    column.width = Math.max(String(column.header ?? "").length * 2.5 + 4, 12);
  });

  worksheet.addRows(rows);

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile({ data: buffer as BlobPart }, `${filename}.xlsx`);
}

/**
 * 解析 Excel
 */
export async function parseExcel(file: File): Promise<Record<string, unknown>[]> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) return [];

  // 第一行作为后续行的键
  const headers: string[] = [];
  worksheet.getRow(1).eachCell((cell) => headers.push(String(cell.value ?? "")));

  const rows: Record<string, unknown>[] = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const record: Record<string, unknown> = {};
    worksheet.getRow(rowNumber).eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (!header) return;
      record[header] = normalizeCellValue(cell.value);
    });
    rows.push(record);
  }

  return rows;
}

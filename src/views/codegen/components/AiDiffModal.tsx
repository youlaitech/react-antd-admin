import { useMemo } from "react";
import { Modal, Table, Tag, Typography, type TableProps } from "antd";

import type { AiFillDiff } from "../composables/useAiFillDiff";

interface AiDiffModalProps {
  /** 是否展示 */
  open: boolean;
  /** 改动明细 */
  diff?: AiFillDiff;
  /** 关闭 */
  onClose: () => void;
  /** 点击字段定位到字段配置 */
  onLocate?: (columnName: string) => void;
}

/** 明细表的行：每行是一处改动，字段列按分组合并 */
interface DiffRow {
  key: string;
  columnName: string;
  fieldName: string;
  label: string;
  from: string;
  to: string;
  /** 同组首行给出合并行数，其余行不渲染该单元格 */
  rowSpan: number;
}

/** AI 改动明细弹窗 */
export default function AiDiffModal({ open, diff, onClose, onLocate }: AiDiffModalProps) {
  const rows = useMemo<DiffRow[]>(
    () =>
      (diff?.fields ?? []).flatMap((group) =>
        group.changes.map((change, index) => ({
          key: `${group.columnName}-${change.label}`,
          columnName: group.columnName,
          fieldName: group.fieldName,
          label: change.label,
          from: change.from,
          to: change.to,
          // 每组的首行负责渲染字段单元格，其余行合并掉
          rowSpan: index === 0 ? group.changes.length : 0,
        }))
      ),
    [diff]
  );

  const columns: TableProps<DiffRow>["columns"] = [
    {
      title: "字段",
      dataIndex: "fieldName",
      width: 180,
      onCell: (row) => ({ rowSpan: row.rowSpan }),
      render: (value: string, row) => (
        <Typography.Link onClick={() => onLocate?.(row.columnName)}>{value}</Typography.Link>
      ),
    },
    { title: "改动项", dataIndex: "label", width: 110 },
    {
      title: "原值",
      dataIndex: "from",
      render: (value: string) => <Typography.Text type="secondary">{value}</Typography.Text>,
    },
    {
      title: "新值",
      dataIndex: "to",
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
  ];

  return (
    <Modal
      title="AI 改动明细"
      width={720}
      open={open}
      footer={null}
      onCancel={onClose}
      destroyOnHidden
    >
      {diff?.businessName && (
        <div className="ai-diff__business">
          <Tag color="processing">{diff.businessName.label}</Tag>
          <Typography.Text type="secondary">{diff.businessName.from}</Typography.Text>
          <span className="ai-diff__arrow">→</span>
          <Typography.Text strong>{diff.businessName.to}</Typography.Text>
        </div>
      )}

      <Table<DiffRow>
        size="small"
        rowKey="key"
        columns={columns}
        dataSource={rows}
        pagination={false}
        scroll={{ y: 360 }}
        locale={{ emptyText: "没有检测到改动" }}
      />
    </Modal>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Checkbox, Space, Table, Typography } from "antd";
import type { TableProps } from "antd";

import { OPERATION_ACTIONS_CLASS, useOperationColumnWidth } from "@/components/OperationColumn";

interface DemoRow {
  /** 行主键：示例数据里 name/zip 都重复，不能用它们做 key */
  id: number;
  date: string;
  name: string;
  state: string;
  city: string;
  address: string;
  zip: string;
  tag: string;
}

const TABLE_DATA: DemoRow[] = [
  {
    id: 1,
    date: "2016-05-03",
    name: "Tom",
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Home",
  },
  {
    id: 2,
    date: "2016-05-02",
    name: "Tom",
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Office",
  },
  {
    id: 3,
    date: "2016-05-04",
    name: "Tom",
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Home",
  },
  {
    id: 4,
    date: "2016-05-01",
    name: "Tom",
    state: "California",
    city: "Los Angeles",
    address: "No. 189, Grove St, Los Angeles",
    zip: "CA 90036",
    tag: "Office",
  },
];

// 可勾选的按钮，勾上即出现在操作列里
const BUTTON_OPTIONS = [
  { key: "view", label: "查看" },
  { key: "long", label: "超过了六个字会怎么显示？" },
  { key: "add", label: "新增" },
  { key: "back", label: "返回很多个字" },
  { key: "edit", label: "编辑" },
] as const;

/**
 * 自适应表格操作栏示例
 */
export default function AutoOperationColumn() {
  const [visibleButtons, setVisibleButtons] = useState<string[]>(["view"]);
  // 模拟异步取数，用来验证数据到达后会重新测量
  const [data, setData] = useState<DemoRow[]>([]);

  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setData(TABLE_DATA), 300);
    return () => window.clearTimeout(timer);
  }, []);

  // 按钮增减或行数变化都要重量一次
  const signature = `${visibleButtons.join(",")}-${data.length}`;
  const operationWidth = useOperationColumnWidth(tableRef, signature);

  const columns = useMemo<TableProps<DemoRow>["columns"]>(
    () => [
      { title: "Date", dataIndex: "date" },
      { title: "Name", dataIndex: "name" },
      { title: "State", dataIndex: "state" },
      { title: "City", dataIndex: "city" },
      { title: "Address", dataIndex: "address" },
      { title: "Zip", dataIndex: "zip" },
      {
        title: "操作",
        key: "operation",
        align: "center",
        fixed: "right",
        width: operationWidth,
        render: (_, row) => (
          <div className={OPERATION_ACTIONS_CLASS}>
            {visibleButtons.includes("view") && (
              <Button type="link" size="small">
                查看
              </Button>
            )}
            {visibleButtons.includes("long") && (
              <Button type="link" size="small">
                超过了六个字会怎么显示？
              </Button>
            )}
            {visibleButtons.includes("add") && (
              <Button type="link" size="small">
                新增
              </Button>
            )}
            {visibleButtons.includes("back") && (
              <Button type="link" size="small">
                返回很多个字
              </Button>
            )}
            {visibleButtons.includes("edit") && (
              <Button type="link" size="small">
                编辑
              </Button>
            )}
            {/* 按行数据追加的按钮，同样计入宽度 */}
            {row.tag === "Home" && (
              <Button type="link" size="small">
                默认
              </Button>
            )}
          </div>
        ),
      },
    ],
    [operationWidth, visibleButtons],
  );

  return (
    <div className="page-container">
      <div className="page-content">
        <Typography.Title level={4} className="m-0">
          自适应表格操作栏
        </Typography.Title>
        <Typography.Text type="secondary">
          该组件适用于含有操作列的表格。在某些情况下，按钮可能需要根据数据状态或其他条件动态展示，无法预设固定宽度。操作列组件能根据按钮数量自适应宽度，不需要再手动设置宽度。
        </Typography.Text>

        <div className="mt-6">
          <Space size="large" wrap>
            {BUTTON_OPTIONS.map((item) => (
              <Checkbox
                key={item.key}
                checked={visibleButtons.includes(item.key)}
                onChange={(event) =>
                  setVisibleButtons((prev) =>
                    event.target.checked
                      ? [...prev, item.key]
                      : prev.filter((key) => key !== item.key),
                  )
                }
              >
                {item.label}
              </Checkbox>
            ))}
          </Space>
        </div>

        <div ref={tableRef} className="mt-4">
          <Table<DemoRow>
            rowKey="id"
            bordered
            columns={columns}
            dataSource={data}
            pagination={false}
            scroll={{ x: 1100 }}
          />
        </div>
      </div>
    </div>
  );
}

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Form,
  Input,
  Modal,
  Pagination,
  Popover,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Upload,
  type TableProps,
} from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  PlusOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SettingOutlined,
  UploadOutlined,
} from "@ant-design/icons";

import { useFullscreen } from "@/hooks/useFullscreen";
import { exportExcel, parseExcel } from "@/utils/excel";
import { validateForm } from "@/utils/form";

/** 大数据量表格示例 */

interface UserRow {
  id: number;
  username: string;
  phone: string;
  email: string;
  /** 逗号分隔的角色标识，与 vxe 示例一致 */
  roles: string;
  status: boolean;
  createTime: string;
}

const STATUS_OPTIONS = [
  { text: "启用", value: true },
  { text: "禁用", value: false },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "管理员",
  user: "普通用户",
  guest: "访客",
};

/** 模拟服务端数据，11 条刚好演示「第 2 页只有 1 条」 */
const MOCK_USERS: UserRow[] = Array.from({ length: 11 }, (_, index) => ({
  id: index + 1,
  username: [
    "admin",
    "张三",
    "李四",
    "王五",
    "赵六",
    "钱七",
    "孙八",
    "周九",
    "吴十",
    "郑十一",
    "冯十二",
  ][index],
  phone: `1380000000${index}`,
  email: `user${index + 1}@youlaitech.com`,
  roles: index % 3 === 0 ? "admin,user" : index % 2 === 0 ? "user" : "guest",
  status: index % 4 !== 3,
  createTime: `2026-09-${String((index % 27) + 1).padStart(2, "0")} 10:24:36`,
}));

/** 隐藏列（vxe 里是 column.visible: false） */
const DEFAULT_HIDDEN_COLUMNS = ["id"];

const PAGE_SIZE = 10;

/** 列顺序的初始值，与 vxe 的列定义顺序一致 */
const MOCK_COLUMN_KEYS = [
  "checkbox",
  "expand",
  "seq",
  "id",
  "username",
  "phone",
  "email",
  "roles",
  "status",
  "createTime",
  "action",
];

/** 列设置面板里展示的列名 */
const COLUMN_TITLES: Record<string, string> = {
  checkbox: "勾选列",
  expand: "展开列",
  seq: "序号",
  id: "ID",
  username: "用户名",
  phone: "手机号",
  email: "邮箱",
  roles: "角色",
  status: "状态",
  createTime: "创建时间",
  action: "操作",
};

/** 打印时输出的列：勾选、展开、序号、操作这些交互列不进纸面 */
const PRINT_COLUMNS: Array<{ key: keyof UserRow; title: string }> = [
  { key: "id", title: "ID" },
  { key: "username", title: "用户名" },
  { key: "phone", title: "手机号" },
  { key: "email", title: "邮箱" },
  { key: "roles", title: "角色" },
  { key: "status", title: "状态" },
  { key: "createTime", title: "创建时间" },
];

/** 单元格取值：角色与状态要转成可读文案 */
function printCellText(row: UserRow, key: keyof UserRow) {
  if (key === "roles") {
    return row.roles
      .split(",")
      .map((role) => ROLE_LABEL[role] ?? role)
      .join("、");
  }
  if (key === "status") return row.status ? "启用" : "禁用";
  return String(row[key] ?? "");
}

interface ResizableTitleProps extends ComponentPropsWithoutRef<"th"> {
  /** 当前列宽 */
  width?: number;
  /** 拖动列宽 */
  onResize?: (event: ReactMouseEvent, width: number) => void;
}

/** 支持拖拽调宽的列头 */
function ResizableTitle({ width, onResize, children, ...restProps }: ResizableTitleProps) {
  if (!width || !onResize) return <th {...restProps}>{children}</th>;

  return (
    // 手柄绝对定位到列头右边缘，这里要给定定位参照
    <th {...restProps} style={{ ...restProps.style, position: "relative" }}>
      {children}
      <span
        className="vxe-demo__resize-handle"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onResize(event, width);
        }}
      />
    </th>
  );
}

export default function VxeTableDemo() {
  const { message, modal } = AntdApp.useApp();

  const [data, setData] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [currentRowId, setCurrentRowId] = useState<number>();

  /** 折叠搜索的查询条件 */
  const [searchForm] = Form.useForm<{ username?: string; roles?: string[] }>();
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);

  /** 手风琴展开：只保留一行 */
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);

  /** 列显隐与顺序（自定义列） */
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(DEFAULT_HIDDEN_COLUMNS);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  /** 拖拽调宽后的列宽 */
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number>();
  const [submitting, setSubmitting] = useState(false);
  const [editForm] = Form.useForm<{ username: string; password: string }>();

  const dragColumnRef = useRef<string | null>(null);

  /** 模拟服务端分页查询 */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 真实项目里这里是接口请求，示例用延时模拟服务端往返
      await new Promise((resolve) => setTimeout(resolve, 500));
      const values = searchForm.getFieldsValue();

      let rows = MOCK_USERS;
      if (values.username) {
        rows = rows.filter((row) => row.username.includes(values.username as string));
      }
      if (values.roles?.length) {
        rows = rows.filter((row) =>
          row.roles.split(",").some((role) => values.roles?.includes(role))
        );
      }

      setTotal(rows.length);
      setData(rows.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE));
    } finally {
      setLoading(false);
    }
  }, [pageNum, searchForm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 角色下拉是异步来的：模拟选项后到时表单已经渲染完成
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRoleOptions([
        { label: "管理员", value: "admin" },
        { label: "普通用户", value: "user" },
        { label: "访客", value: "guest" },
      ]);
    }, 500);
    return () => window.clearTimeout(timer);
  }, []);

  /** 删除 */
  const handleDelete = useCallback(
    (ids: number[]) => {
      modal.confirm({
        title: "确认删除",
        content: `确认删除选中的 ${ids.length} 条数据吗？`,
        onOk: () => {
          message.success("删除成功");
          setSelectedRowKeys([]);
          fetchData();
        },
      });
    },
    [fetchData, message, modal]
  );

  /** 导出当前查询结果 */
  const handleExport = useCallback(async () => {
    if (!data.length) {
      message.warning("当前没有可导出的数据");
      return;
    }

    const rows = data.map((row) => ({
      ...row,
      roles: row.roles
        .split(",")
        .map((role) => ROLE_LABEL[role] ?? role)
        .join("、"),
      status: row.status ? "启用" : "禁用",
    }));

    await exportExcel({
      filename: "用户数据",
      sheetname: "用户",
      columns: [
        { header: "用户名", key: "username" },
        { header: "手机号", key: "phone" },
        { header: "邮箱", key: "email" },
        { header: "角色", key: "roles" },
        { header: "状态", key: "status" },
        { header: "创建时间", key: "createTime" },
      ],
      rows,
    });
    message.success(`已导出 ${rows.length} 条数据`);
  }, [data, message]);

  /** 导入 */
  async function handleImport(file: File) {
    let rows: Record<string, unknown>[];
    try {
      rows = await parseExcel(file);
    } catch {
      message.error("文件解析失败，请确认是有效的 Excel 文件");
      return;
    }

    if (!rows.length) {
      message.warning("未解析到数据，请检查文件内容");
      return;
    }
    message.success(`解析到 ${rows.length} 行数据（示例不写库）`);
  }

  /** 打印当前页 */
  function handlePrint() {
    const columns = PRINT_COLUMNS.filter((col) => !hiddenColumns.includes(col.key));

    const html = `
      <table>
        <thead><tr>${columns.map((col) => `<th>${col.title}</th>`).join("")}</tr></thead>
        <tbody>
          ${data
            .map(
              (row) =>
                `<tr>${columns
                  .map((col) => `<td>${printCellText(row, col.key)}</td>`)
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;

    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(frame);

    const doc = frame.contentDocument;
    if (!doc) {
      document.body.removeChild(frame);
      return;
    }

    doc.write(`
      <html>
        <head>
          <title>用户数据</title>
          <style>
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { padding: 6px 8px; text-align: left; border: 1px solid #d9d9d9; }
            th { background: #fafafa; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    doc.close();

    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    // 打印是异步的，立刻移除 iframe 会打断打印任务
    window.setTimeout(() => document.body.removeChild(frame), 1000);
  }

  /** 打开弹窗：编辑时用行数据回填 */
  const openModal = useCallback(
    (row?: UserRow) => {
      setEditingId(row?.id);
      editForm.resetFields();
      if (row) editForm.setFieldsValue({ username: row.username, password: "" });
      setModalOpen(true);
    },
    [editForm]
  );

  /** 提交弹窗表单 */
  async function handleSubmit() {
    // 示例不落库，校验通过即视为提交成功
    const values = await validateForm(editForm);
    if (!values) return;

    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      message.success(editingId ? "修改成功" : "新增成功");
      setModalOpen(false);
      fetchData();
    } finally {
      setSubmitting(false);
    }
  }

  /** 列顺序：按自定义顺序排序，未登记的列排在后面 */
  const orderedKeys = useMemo(
    () => (columnOrder.length ? columnOrder : MOCK_COLUMN_KEYS),
    [columnOrder]
  );

  const allColumns = useMemo<NonNullable<TableProps<UserRow>["columns"]>>(() => {
    const columns: NonNullable<TableProps<UserRow>["columns"]> = [
      { key: "checkbox", width: 50 },
      {
        key: "expand",
        // 展开/收起是两个字，宽度给窄了会换行
        width: 72,
        align: "center",
        render: (_, row) => (
          // 展开按钮：手风琴模式下点击已展开的行会收起
          <Button
            type="link"
            size="small"
            onClick={() => {
              setExpandedRowKeys((prev) => (prev.includes(row.id) ? [] : [row.id]));
            }}
          >
            {expandedRowKeys.includes(row.id) ? "收起" : "展开"}
          </Button>
        ),
      },
      {
        key: "seq",
        width: 60,
        align: "center",
        title: "序号",
        // 序号跨页连续，与 vxe 的 proxyConfig.seq 一致
        render: (_, __, index) => (pageNum - 1) * PAGE_SIZE + index + 1,
      },
      { key: "id", title: "ID", dataIndex: "id", width: 70, align: "center" },
      { key: "username", title: "用户名", dataIndex: "username", width: 140 },
      { key: "phone", title: "手机号", dataIndex: "phone", width: 150 },
      { key: "email", title: "邮箱", dataIndex: "email", width: 220 },
      {
        key: "roles",
        title: "角色",
        dataIndex: "roles",
        width: 180,
        render: (value: string) => (
          <Space size={4}>
            {value.split(",").map((role) => (
              <Tag key={role} color="processing">
                {ROLE_LABEL[role] ?? role}
              </Tag>
            ))}
          </Space>
        ),
      },
      {
        key: "status",
        title: "状态",
        dataIndex: "status",
        width: 110,
        align: "center",
        // 排序与筛选都走 antd 的本地实现，与 vxe 的 remote: false 等价
        sorter: (a, b) => Number(a.status) - Number(b.status),
        filters: STATUS_OPTIONS,
        filterMultiple: false,
        onFilter: (value, row) => row.status === value,
        render: (value: boolean) => (
          <Tag color={value ? "success" : "default"}>{value ? "启用" : "禁用"}</Tag>
        ),
      },
      {
        key: "createTime",
        title: "创建时间",
        dataIndex: "createTime",
        width: 180,
        sorter: (a, b) => a.createTime.localeCompare(b.createTime),
      },
      {
        key: "action",
        title: "操作",
        width: 150,
        align: "center",
        fixed: "right",
        render: (_, row) => (
          <Space size={0}>
            <Button type="link" size="small" onClick={() => openModal(row)}>
              修改
            </Button>
            <Button type="link" size="small" danger onClick={() => handleDelete([row.id])}>
              删除
            </Button>
          </Space>
        ),
      },
    ];

    // 按自定义顺序排列，再叠加显隐与列宽
    return orderedKeys
      .map((key) => columns.find((col) => col.key === key))
      .filter((col): col is NonNullable<TableProps<UserRow>["columns"]>[number] => !!col)
      .filter((col) => !hiddenColumns.includes(String(col.key)))
      .map((col) => {
        const key = String(col.key);
        const width = columnWidths[key] ?? col.width;
        return {
          ...col,
          width,
          // 列头接拖拽手柄，宽度由本地 state 接管
          onHeaderCell: () => ({
            width,
            onResize: (event: ReactMouseEvent, current: number) => startResize(key, event, current),
          }),
        };
      });
  }, [columnWidths, expandedRowKeys, handleDelete, hiddenColumns, openModal, orderedKeys, pageNum]);

  /** 拖动列宽：按下后监听鼠标移动直到松开 */
  function startResize(key: string, event: ReactMouseEvent, currentWidth: number) {
    const startX = event.clientX;

    function handleMove(moveEvent: MouseEvent) {
      const next = Math.max(60, currentWidth + moveEvent.clientX - startX);
      setColumnWidths((prev) => ({ ...prev, [key]: next }));
    }

    function handleUp() {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    }

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  }

  /** 列设置里的拖拽换序 */
  function handleColumnDragOver(targetKey: string, event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const from = dragColumnRef.current;
    if (!from || from === targetKey) return;

    setColumnOrder((prev) => {
      const keys = prev.length ? [...prev] : [...MOCK_COLUMN_KEYS];
      const fromIndex = keys.indexOf(from);
      const toIndex = keys.indexOf(targetKey);
      if (fromIndex < 0 || toIndex < 0) return keys;
      keys.splice(toIndex, 0, keys.splice(fromIndex, 1)[0]);
      return keys;
    });
    dragColumnRef.current = targetKey;
  }

  return (
    <div className="page-container">
      <Card variant="borderless">
        <div className="vxe-demo__toolbar">
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              新增用户
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={!selectedRowKeys.length}
              onClick={() => handleDelete(selectedRowKeys)}
            >
              批量删除
            </Button>
          </Space>

          <Space wrap>
            <Upload
              accept=".xlsx,.xls"
              showUploadList={false}
              beforeUpload={(file) => {
                void handleImport(file);
                return false;
              }}
            >
              <Button icon={<UploadOutlined />}>导入</Button>
            </Upload>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              打印
            </Button>
            <Tooltip title="刷新">
              <Button icon={<ReloadOutlined />} onClick={fetchData} />
            </Tooltip>
            <Popover
              trigger="click"
              placement="bottomRight"
              content={
                <div className="vxe-demo__column-setting">
                  <div className="vxe-demo__column-setting-tip">勾选显隐，拖拽调整顺序</div>
                  {(columnOrder.length ? columnOrder : MOCK_COLUMN_KEYS).map((key) => {
                    const title = COLUMN_TITLES[key] ?? key;
                    const disabled = key === "checkbox" || key === "expand" || key === "action";
                    return (
                      <div
                        key={key}
                        className="vxe-demo__column-setting-item"
                        draggable={!disabled}
                        onDragStart={() => {
                          dragColumnRef.current = key;
                        }}
                        onDragOver={(event) => !disabled && handleColumnDragOver(key, event)}
                        onDragEnd={() => {
                          dragColumnRef.current = null;
                        }}
                      >
                        <Checkbox
                          checked={!hiddenColumns.includes(key)}
                          disabled={disabled}
                          onChange={(event) =>
                            setHiddenColumns((prev) =>
                              event.target.checked
                                ? prev.filter((item) => item !== key)
                                : [...prev, key]
                            )
                          }
                        >
                          {title}
                        </Checkbox>
                      </div>
                    );
                  })}
                </div>
              }
            >
              <Button icon={<SettingOutlined />}>列设置</Button>
            </Popover>
            <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
              <Button
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
              />
            </Tooltip>
          </Space>
        </div>

        <Form form={searchForm} className="vxe-demo__search" onFinish={() => setPageNum(1)}>
          <Form.Item name="username" label="用户名">
            <Input placeholder="请输入用户名" allowClear style={{ width: 200 }} />
          </Form.Item>

          {/* 折叠项：收起时不渲染，与 vxe 的 folding 一致 */}
          {searchExpanded && (
            <Form.Item name="roles" label="角色">
              <Select
                mode="multiple"
                allowClear
                placeholder="请选择角色"
                options={roleOptions}
                style={{ width: 260 }}
              />
            </Form.Item>
          )}

          <Space>
            <Button type="primary" htmlType="submit">
              搜索
            </Button>
            <Button
              onClick={() => {
                searchForm.resetFields();
                setPageNum(1);
              }}
            >
              重置
            </Button>
            <Button type="link" onClick={() => setSearchExpanded((prev) => !prev)}>
              {searchExpanded ? "收起" : "展开"}
            </Button>
          </Space>
        </Form>

        <Table<UserRow>
          rowKey="id"
          columns={allColumns}
          dataSource={data}
          loading={loading}
          pagination={false}
          scroll={{ x: 1500 }}
          components={{ header: { cell: ResizableTitle } }}
          rowSelection={{
            selectedRowKeys,
            preserveSelectedRowKeys: true,
            onChange: (keys) => setSelectedRowKeys(keys as number[]),
          }}
          expandable={{
            // 展开内容由列上的按钮控制，这里不要 antd 自带的展开图标
            showExpandColumn: false,
            expandedRowKeys,
            expandedRowRender: (row) => (
              <Descriptions
                className="vxe-demo__expand"
                size="small"
                column={3}
                items={[
                  { key: "id", label: "ID", children: row.id },
                  { key: "username", label: "用户名", children: row.username },
                  { key: "createTime", label: "创建时间", children: row.createTime },
                ]}
              />
            ),
          }}
          onRow={(row) => ({
            onClick: () => setCurrentRowId(row.id),
            className: currentRowId === row.id ? "vxe-demo__row--current" : undefined,
          })}
          summary={(rows) => {
            // vxe 的 footerMethod：汇总本页条数与启用数，其余列留空。
            // 列会被隐藏或调序，按当前可见列数算跨度，否则汇总行会跟表体错位
            const enabled = rows.filter((row) => row.status).length;
            const columnCount = allColumns.length;

            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={Math.max(columnCount - 4, 1)}>
                  本页合计
                </Table.Summary.Cell>
                <Table.Summary.Cell index={columnCount - 4} align="center">
                  {rows.length} 条
                </Table.Summary.Cell>
                <Table.Summary.Cell index={columnCount - 3} align="center">
                  启用 {enabled} 条
                </Table.Summary.Cell>
                <Table.Summary.Cell index={columnCount - 2} colSpan={2} />
              </Table.Summary.Row>
            );
          }}
        />

        <div className="vxe-demo__pagination">
          <Pagination
            current={pageNum}
            pageSize={PAGE_SIZE}
            total={total}
            showSizeChanger={false}
            showTotal={(count) => `共 ${count} 条`}
            onChange={(page) => setPageNum(page)}
          />
        </div>
      </Card>

      <Modal
        title={editingId ? "修改用户" : "新增用户"}
        open={modalOpen}
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={editForm} labelCol={{ span: 5 }} className="pt-4">
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              {
                validator: (_, value: string) => {
                  if (!value) return Promise.reject(new Error("请输入用户名"));
                  if (!value.trim()) return Promise.reject(new Error("空格无效"));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              {
                validator: (_, value: string) => {
                  if (!value) return Promise.reject(new Error("请输入密码"));
                  if (!value.trim()) return Promise.reject(new Error("空格无效"));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

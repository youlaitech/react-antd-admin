import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type DragEvent,
} from "react";
import { Button, Card, Table } from "antd";
import type { TableProps } from "antd";

interface UserItem {
  name: string;
  roles: string;
}

const INITIAL_USERS: UserItem[] = [
  { name: "路飞", roles: "船长·格斗家" },
  { name: "索隆", roles: "剑豪·战斗员·三刀流" },
  { name: "娜美", roles: "航海士·气象学家·财务官" },
  { name: "山治", roles: "厨师·格斗家·黑足" },
  { name: "罗宾", roles: "考古学家·历史学家" },
];

/** 列配置：写成非可选类型，后面才能在它基础上追加操作列 */
type UserColumns = NonNullable<TableProps<UserItem>["columns"]>;

const BASE_COLUMNS: UserColumns = [
  { title: "姓名", dataIndex: "name" },
  { title: "角色", dataIndex: "roles" },
];

type RowProps = ComponentPropsWithoutRef<"tr"> & { "data-row-key"?: string };

/** 列表拖拽排序 */
function useReorder<T>(items: T[], onChange: (next: T[]) => void) {
  const itemsRef = useRef(items);
  const onChangeRef = useRef(onChange);
  itemsRef.current = items;
  onChangeRef.current = onChange;

  const dragIndexRef = useRef<number | null>(null);

  const startDrag = useCallback((index: number) => {
    dragIndexRef.current = index;
  }, []);

  const dragOver = useCallback((index: number, event: DragEvent<HTMLElement>) => {
    // 不阻止默认行为就不会触发 drop，拖动过程中也无法换位
    event.preventDefault();

    const from = dragIndexRef.current;
    if (from === null || from === index) return;

    const next = [...itemsRef.current];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    // 换位后起点跟着走，否则连续经过多行会错位
    dragIndexRef.current = index;
    onChangeRef.current(next);
  }, []);

  const endDrag = useCallback(() => {
    dragIndexRef.current = null;
  }, []);

  // 表格行只能拿到 rowKey，转换回下标时始终取最新列表
  const resolveIndex = useCallback(
    (predicate: (item: T) => boolean) => itemsRef.current.findIndex(predicate),
    []
  );

  return useMemo(
    () => ({ startDrag, dragOver, endDrag, resolveIndex }),
    [dragOver, endDrag, resolveIndex, startDrag]
  );
}

/**
 * 拖拽排序示例，四个示例共用一份数据
 */
export default function DragDemo() {
  // 四个示例共用一份数据，任意一处拖动其余三处同步变化
  const [users, setUsers] = useState<UserItem[]>(INITIAL_USERS);
  const reorder = useReorder(users, setUsers);

  const columnsWithHandle = useMemo<UserColumns>(
    () => [
      ...BASE_COLUMNS,
      {
        title: "操作",
        key: "action",
        width: 100,
        render: () => (
          <Button size="small" className="drag-handle">
            移动
          </Button>
        ),
      },
    ],
    []
  );

  // 把 antd 的行换成可拖拽的 tr
  const createRowComponents = useCallback(
    (handleOnly: boolean): TableProps<UserItem>["components"] => {
      function DraggableRow(props: RowProps) {
        const { className, ...rest } = props;
        const index = reorder.resolveIndex((item) => item.name === props["data-row-key"]);

        return (
          <tr
            {...rest}
            className={`drag-row ${className ?? ""}`.trim()}
            draggable
            onDragStart={(event) => {
              if (handleOnly && !(event.target as HTMLElement).closest(".drag-handle")) {
                event.preventDefault();
                return;
              }
              reorder.startDrag(index);
            }}
            onDragOver={(event) => reorder.dragOver(index, event)}
            onDragEnd={reorder.endDrag}
          />
        );
      }

      return { body: { row: DraggableRow } };
    },
    [reorder]
  );

  const plainRowComponents = useMemo(() => createRowComponents(false), [createRowComponents]);
  const handleRowComponents = useMemo(() => createRowComponents(true), [createRowComponents]);

  return (
    <div className="page-container">
      <div className="grid grid-cols-12 gap-6">
        <Card title="基础示例" className="col-span-6" variant="borderless">
          <div className="drag-container">
            {users.map((item, index) => (
              <div
                key={item.name}
                className="drag-item"
                draggable
                onDragStart={() => reorder.startDrag(index)}
                onDragOver={(event) => reorder.dragOver(index, event)}
                onDragEnd={reorder.endDrag}
              >
                {item.name}
              </div>
            ))}
          </div>
        </Card>

        <Card title="过渡动画" className="col-span-6" variant="borderless">
          <ul className="drag-container sort-target">
            {users.map((item, index) => (
              <li
                key={item.name}
                className="drag-item drag-item--fade"
                draggable
                onDragStart={() => reorder.startDrag(index)}
                onDragOver={(event) => reorder.dragOver(index, event)}
                onDragEnd={reorder.endDrag}
              >
                {item.name}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="表格拖拽排序" className="mt-4" variant="borderless">
        <Table<UserItem>
          rowKey="name"
          columns={BASE_COLUMNS}
          dataSource={users}
          pagination={false}
          components={plainRowComponents}
        />
      </Card>

      <Card title="指定元素拖拽排序" className="mt-4" variant="borderless">
        <Table<UserItem>
          rowKey="name"
          columns={columnsWithHandle}
          dataSource={users}
          pagination={false}
          components={handleRowComponents}
        />
      </Card>
    </div>
  );
}

import { Tag } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface TodoItem {
  id: number;
  title: string;
  tag: string;
  time: string;
  done: boolean;
}

// 演示数据，接入待办接口后替换
const todoItems: TodoItem[] = [
  { id: 1, title: "审批：张三提交的请假申请", tag: "审批", time: "10分钟前", done: false },
  { id: 2, title: "审核：新用户注册信息核实", tag: "审核", time: "30分钟前", done: false },
  { id: 3, title: "通知：系统维护窗口安排", tag: "通知", time: "1小时前", done: false },
  { id: 4, title: "工单：导出报表失败排查", tag: "工单", time: "2小时前", done: false },
  { id: 5, title: "审批：部门预算调整申请", tag: "审批", time: "昨天 15:20", done: true },
];

const TAG_COLOR_MAP: Record<string, string> = {
  审批: "warning",
  审核: "processing",
  通知: "default",
  工单: "error",
};

/**
 * 待办事项
 */
export default function TodoList() {
  const { t } = useTranslation();

  return (
    <div className="dash-card">
      <div className="dash-card__head">
        <h3 className="dash-card__title">{t("dashboard.todoItems")}</h3>
        <Tag>{t("dashboard.todoCount", { count: todoItems.length })}</Tag>
      </div>

      <div className="dash-card__body">
        {todoItems.map((todo) => (
          <div key={todo.id} className={`todo-row ${todo.done ? "is-done" : ""}`}>
            {todo.done ? (
              <CheckCircleOutlined className="todo-row__icon is-done" />
            ) : (
              <ClockCircleOutlined className="todo-row__icon is-pending" />
            )}
            <span className="todo-row__title">{todo.title}</span>
            <Tag className="todo-row__tag" color={todo.done ? "success" : TAG_COLOR_MAP[todo.tag]}>
              {todo.tag}
            </Tag>
            <span className="todo-row__time">{todo.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

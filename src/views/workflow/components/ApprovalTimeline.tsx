import { Empty, Tag, Timeline } from "antd";

import type { ApprovalHistoryItem } from "@/api/workflow";

interface ApprovalTimelineProps {
  /** 审批记录（按时间正序） */
  history: ApprovalHistoryItem[];
}

/** 审批记录时间线 */
export default function ApprovalTimeline({ history }: ApprovalTimelineProps) {
  if (history.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无审批记录"
        className="workflow-empty"
      />
    );
  }

  return (
    <Timeline
      className="approval-timeline"
      items={history.map((item, index) => ({
        key: `${item.activityId ?? item.activityName}-${index}`,
        color: item.endTime ? "green" : "blue",
        children: (
          <>
            <div className="approval-timeline__title">
              <span>{item.activityName}</span>
              {item.assignee ? (
                <Tag variant="outlined">{item.assignee}</Tag>
              ) : (
                <Tag variant="outlined">未办理</Tag>
              )}
              {!item.endTime && <Tag color="warning">进行中</Tag>}
            </div>
            {item.comment && <div className="approval-timeline__comment">{item.comment}</div>}
            <div className="approval-timeline__time">
              {item.endTime ? `办理于 ${item.endTime}` : `开始于 ${item.startTime ?? "-"}`}
            </div>
          </>
        ),
      }))}
    />
  );
}

import { useMemo } from "react";
import { Empty, Tag, Timeline } from "antd";

import type { ApprovalHistoryItem, InstanceStatus, ProcessStageItem } from "@/api/workflow";

interface ApprovalFlowTimelineProps {
  /** 审批环节（按 BPMN 编排顺序，含分支未走节点） */
  stages: ProcessStageItem[];
  /** 审批记录（按时间正序） */
  history: ApprovalHistoryItem[];
  /** 当前进行中环节下标（运行中有效） */
  active: number;
  /** 实例状态：非运行中视为已结束，无记录环节均为「未经过」 */
  status: InstanceStatus;
}

/**
 * 环节办理人描述
 */
function describe(stage: ProcessStageItem): string {
  if (stage.initiator) return "发起人";

  const roles = stage.roleNames.join("、");
  const users = stage.userNames.join("、");
  if (roles && users) return `${roles}（${users}）`;

  return roles || users || "未配置办理人";
}

/** 审批流程时间线（流程走向 + 审批记录融合） */
export default function ApprovalFlowTimeline({
  stages,
  history,
  active,
  status,
}: ApprovalFlowTimelineProps) {
  /** 节点 ID -> 办理记录（驳回重办为多条） */
  const recordMap = useMemo(() => {
    const map = new Map<string, ApprovalHistoryItem[]>();

    history.forEach((item) => {
      if (!item.activityId) return;
      map.set(item.activityId, [...(map.get(item.activityId) ?? []), item]);
    });

    return map;
  }, [history]);

  /** 是否「未到」：流程运行中且位于当前环节之后 */
  const isUpcoming = (index: number) => status === "running" && index >= active;

  if (stages.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无审批流程"
        className="workflow-empty"
      />
    );
  }

  return (
    <Timeline className="approval-flow">
      {stages.flatMap((stage, index) => {
        const records = recordMap.get(stage.nodeId) ?? [];

        // 无记录：运行中按位置区分「未到」与「未经过」（网关分支跳过），已结束均为未经过
        if (records.length === 0) {
          const upcoming = isUpcoming(index);

          return [
            <Timeline.Item key={`${stage.nodeId}-pending`} color="gray">
              <div className={`approval-flow__title${upcoming ? "" : " is-skipped"}`}>
                <span>{stage.nodeName}</span>
                <Tag variant="outlined">{upcoming ? "未到" : "未经过"}</Tag>
              </div>
              <div className={`approval-flow__time${upcoming ? "" : " is-skipped"}`}>
                {describe(stage)}
              </div>
            </Timeline.Item>,
          ];
        }

        // 有记录：驳回重办会在同一节点产生多条，全部按时间展示
        return records.map((record, recordIndex) => (
          <Timeline.Item
            key={`${stage.nodeId}-${record.startTime ?? recordIndex}`}
            color={record.endTime ? "green" : "blue"}
          >
            <div className="approval-flow__title">
              <div className="approval-flow__name">
                <span>{stage.nodeName}</span>
                {record.assignee && <Tag variant="outlined">{record.assignee}</Tag>}
              </div>
              <Tag color={record.endTime ? "success" : "warning"}>
                {record.endTime ? "已办理" : "进行中"}
              </Tag>
            </div>
            <div className="approval-flow__time">
              {record.endTime
                ? `办理于 ${record.endTime}`
                : record.assignee
                  ? `等待 ${record.assignee} 办理`
                  : `待 ${describe(stage)} 认领办理`}
            </div>
            {record.comment && <div className="approval-flow__comment">{record.comment}</div>}
          </Timeline.Item>
        ));
      })}
    </Timeline>
  );
}

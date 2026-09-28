import { Steps } from "antd";

import type { ProcessStageItem } from "@/api/workflow";

interface ProcessStagesProps {
  /** 审批环节（按 BPMN 编排顺序） */
  stages: ProcessStageItem[];
  /** 高亮位置：当前环节下标（之前为完成、当前为进行中）；发起页预览传 -1 表示全部待开始 */
  active: number;
  /** 外层类名，供承载页控制间距 */
  className?: string;
}

/** 环节办理人描述 */
function describe(stage: ProcessStageItem): string {
  if (stage.initiator) return "发起人办理";

  const roles = stage.roleNames.join("、");
  const users = stage.userNames.join("、");
  if (roles && users) return `${roles}（${users}）`;

  return roles || users || "未配置办理人";
}

/** 审批环节进度条 */
export default function ProcessStages({ stages, active, className }: ProcessStagesProps) {
  return (
    <Steps
      className={`process-stages${className ? ` ${className}` : ""}`}
      size="small"
      labelPlacement="vertical"
      // antd 的 current 不接受负数，发起页的全待开始用 0 表示
      current={active < 0 ? 0 : active}
      items={stages.map((stage) => ({
        title: stage.nodeName,
        description: <span className="process-stages__desc">{describe(stage)}</span>,
      }))}
    />
  );
}

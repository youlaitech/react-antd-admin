import { useCallback, useEffect, useState } from "react";
import { Descriptions, Drawer, Empty, Skeleton, Tabs, Tag } from "antd";

import WorkflowAPI from "@/api/workflow";
import type { InstanceDetailData, InstanceStatus, ProcessDiagramData } from "@/api/workflow";
import ApprovalFlowTimeline from "./ApprovalFlowTimeline";
import BpmnViewer from "./BpmnViewer";
import FormDetail from "./FormDetail";

/** 实例状态展示映射 */
const STATUS_OPTIONS: Record<InstanceStatus, { label: string; color: string }> = {
  running: { label: "运行中", color: "processing" },
  finished: { label: "已完成", color: "success" },
  terminated: { label: "已终止", color: "error" },
};

interface InstanceDetailDrawerProps {
  /** 流程实例 ID，有值时打开 */
  instanceId?: string;
  /** 关闭 */
  onClose: () => void;
}

/** 流程实例详情抽屉 */
export default function InstanceDetailDrawer({ instanceId, onClose }: InstanceDetailDrawerProps) {
  const [detail, setDetail] = useState<InstanceDetailData>();
  const [diagram, setDiagram] = useState<ProcessDiagramData>();
  const [loading, setLoading] = useState(false);

  const open = Boolean(instanceId);

  /** 详情与流程图互不依赖，并行加载 */
  const load = useCallback(async (id: string) => {
    setLoading(true);
    setDetail(undefined);
    setDiagram(undefined);
    try {
      const [detailData, diagramData] = await Promise.all([
        WorkflowAPI.instance.getDetail(id),
        WorkflowAPI.instance.getDiagram(id),
      ]);
      setDetail(detailData);
      setDiagram(diagramData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (instanceId) load(instanceId);
  }, [instanceId, load]);

  const status = detail ? STATUS_OPTIONS[detail.status] : undefined;

  return (
    <Drawer width={720} open={open} title="流程详情" destroyOnHidden onClose={onClose}>
      {loading || !detail ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <>
          <Descriptions
            column={2}
            bordered
            size="small"
            items={[
              { key: "name", label: "流程名称", children: detail.processName },
              { key: "startUser", label: "发起人", children: detail.startUser || "-" },
              {
                key: "status",
                label: "状态",
                children: <Tag color={status?.color}>{status?.label}</Tag>,
              },
              { key: "startTime", label: "发起时间", children: detail.startTime },
              { key: "endTime", label: "结束时间", children: detail.endTime || "-" },
              { key: "deleteReason", label: "终止原因", children: detail.deleteReason || "-" },
            ]}
          />

          <Tabs
            className="instance-detail__tabs"
            items={[
              {
                key: "form",
                label: "表单数据",
                children: detail.formJson ? (
                  <FormDetail
                    formJson={detail.formJson}
                    optionsJson={detail.optionsJson}
                    dataJson={detail.dataJson}
                  />
                ) : (
                  // formKey 有值说明绑定了表单，数据为空即发起数据已被清理（如重置过演示数据）
                  <Empty
                    className="workflow-empty"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={detail.formKey ? "表单数据不存在或已被清理" : "该流程未绑定表单"}
                  />
                ),
              },
              {
                key: "flow",
                label: "审批流程",
                children: (
                  <ApprovalFlowTimeline
                    stages={detail.stages}
                    history={detail.history}
                    active={detail.activeStageIndex ?? 0}
                    status={detail.status}
                  />
                ),
              },
              {
                key: "diagram",
                label: "流程图",
                children: (
                  <div className="instance-detail__diagram">
                    {diagram?.bpmnXml ? (
                      <BpmnViewer
                        xml={diagram.bpmnXml}
                        executedActivityIds={diagram.executedActivityIds}
                        activeActivityIds={diagram.activeActivityIds}
                      />
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        </>
      )}
    </Drawer>
  );
}

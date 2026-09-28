import { useCallback, useMemo, useRef, useState } from "react";
import {
  App as AntdApp,
  Button,
  Input,
  Modal,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import WorkflowAPI from "@/api/workflow";
import type {
  WorkflowModelFormData,
  WorkflowModelItem,
  WorkflowModelQueryParams,
} from "@/api/workflow";
import { CrudModal, CrudTable, useCrudPage } from "@/components/Crud";
import type { CrudFormItem, CrudModalConfig, CrudTableConfig } from "@/components/Crud";
import { useAuth } from "@/hooks/useAuth";
import { useFullscreen } from "@/hooks/useFullscreen";
import { findRoutePathByComponent } from "@/router/menu";
import { usePermissionStore } from "@/stores/permission";
import BpmnViewer from "./components/BpmnViewer";

/** 流程标识只允许小写字母、数字与下划线，且以字母开头 */
const MODEL_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

/** 弹窗表单载荷：编辑时由封装补齐主键，用于区分新增与修改 */
type ModelFormPayload = WorkflowModelFormData & { id?: string };

/** 流程设计列表页 */
export default function WorkflowModel() {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const menuRoutes = usePermissionStore((state) => state.menuRoutes);
  const { hasPermission } = useAuth();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  // reload 由 useCrudPage 提供，而它需要先拿到 onOperate 回调，用 ref 承接
  const reloadRef = useRef<() => void>(() => undefined);

  const [resetting, setResetting] = useState(false);
  /** 正在切换启用状态的流程 ID（该行转圈，其余行禁用防并发） */
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  /** 流程图弹窗 */
  const [diagram, setDiagram] = useState<{ title: string; xml: string; loading: boolean }>();

  // openEdit 由 useCrudPage 返回，而它需要先拿到 onOperate 回调，用 ref 承接
  const openEditRef = useRef<(row: WorkflowModelItem) => void>(() => undefined);

  /** 启用开关权限：开关不支持按权限条件移除，改用权限位控制显隐 */
  const canUpdateState = hasPermission("workflow:definition:update");

  /** 打开已发布版本的流程图弹窗 */
  const openDiagram = useCallback(
    async (row: WorkflowModelItem) => {
      if (!row.definitionId) {
        message.warning("该流程尚未发布，请先发布");
        return;
      }

      setDiagram({ title: `【${row.name}】流程图`, xml: "", loading: true });
      try {
        const data = await WorkflowAPI.definition.getXml(row.definitionId);
        setDiagram((prev) => (prev ? { ...prev, xml: data.xml ?? "", loading: false } : prev));
      } catch {
        setDiagram((prev) => (prev ? { ...prev, loading: false } : prev));
      }
    },
    [message]
  );

  /** 发布流程：生成新版本，发布后即可发起 */
  const handleDeploy = useCallback(
    (modelId: string) => {
      modal.confirm({
        title: "提示",
        content: "发布后即可发起流程，历史版本不受影响，确定发布?",
        onOk: async () => {
          await WorkflowAPI.model.deploy(modelId);
          message.success("发布成功");
          reloadRef.current();
        },
      });
    },
    [message, modal]
  );

  /** 切换流程启用状态：关闭后不可发起新流程，运行中的实例不受影响 */
  const handleToggleState = useCallback(
    async (row: WorkflowModelItem) => {
      if (!row.definitionId) return;

      const suspend = !row.suspended;
      setSwitchingId(row.id);
      try {
        await WorkflowAPI.definition.updateState(row.definitionId, suspend);
        message.success(suspend ? "已关闭，不可发起" : "已开启，可发起");
        reloadRef.current();
      } finally {
        setSwitchingId(null);
      }
    },
    [message]
  );

  /** 重置工作流数据：清空自建内容并重建初始演示流程 */
  const handleResetDemo = useCallback(() => {
    modal.confirm({
      title: "重置工作流数据",
      content:
        "将清空所有流程（含用户自建）的模型、发布版本、实例与历史记录，恢复至 4 个初始演示流程。确定重置?",
      okText: "重置",
      okButtonProps: { danger: true },
      onOk: async () => {
        setResetting(true);
        try {
          await WorkflowAPI.model.resetDemo();
          message.success("已重置为初始演示版本");
          reloadRef.current();
        } finally {
          setResetting(false);
        }
      },
    });
  }, [message, modal]);

  const tableConfig: CrudTableConfig<WorkflowModelItem, WorkflowModelQueryParams> = useMemo(
    () => ({
      permPrefix: "workflow:model",
      pk: "id",
      toolbar: [
        "add",
        "delete",
        {
          name: "reset_demo",
          text: "重置演示",
          perm: "workflow:model:reset",
          loading: resetting,
        },
      ],
      defaultToolbar: ["refresh"],
      cols: [
        { type: "selection", width: 55, align: "center" },
        {
          label: "流程名称",
          prop: "name",
          width: 180,
          render: (row) => (
            <Typography.Link title="点击修改名称与描述" onClick={() => openEditRef.current(row)}>
              {row.name}
            </Typography.Link>
          ),
        },
        { label: "流程标识", prop: "key", width: 160 },
        { label: "描述", prop: "description", width: 150 },
        {
          label: "启用",
          prop: "suspended",
          width: 120,
          align: "center",
          render: (row) => {
            if (!row.definitionId) return <Tag>未发布</Tag>;

            return (
              <Space size={6}>
                <span className="workflow-version">v{row.publishedVersion}</span>
                {canUpdateState ? (
                  <Switch
                    size="small"
                    checked={!row.suspended}
                    loading={switchingId === row.id}
                    disabled={switchingId !== null && switchingId !== row.id}
                    onChange={() => handleToggleState(row)}
                  />
                ) : (
                  <Tag color={row.suspended ? "default" : "success"}>
                    {row.suspended ? "否" : "是"}
                  </Tag>
                )}
              </Space>
            );
          },
        },
        { label: "更新时间", prop: "updateTime", width: 170, align: "center" },
        {
          label: "操作",
          width: 240,
          align: "center",
          templet: "tool",
          operat: [
            { name: "design", text: "设计" },
            { name: "deploy", text: "发布", perm: "workflow:model:deploy" },
            {
              name: "diagram",
              text: "流程图",
              render: (row) => Boolean(row.definitionId),
            },
            "delete",
          ],
        },
      ],
      indexAction: (params) => WorkflowAPI.model.getPage(params),
      deleteAction: (ids) => WorkflowAPI.model.deleteByIds(ids),
    }),
    [canUpdateState, handleToggleState, resetting, switchingId]
  );

  const modalConfig = useCallback((isEdit: boolean): CrudModalConfig<ModelFormPayload> => {
    const formItems: CrudFormItem[] = [
      {
        label: "流程名称",
        prop: "name",
        type: "input",
        required: true,
        placeholder: "请输入流程名称",
      },
      {
        label: "流程标识",
        prop: "key",
        type: "input",
        required: true,
        placeholder: "如 leave_approval",
        tip: "创建后不可修改，建议用有业务含义的英文编码",
        rules: [
          { pattern: MODEL_KEY_PATTERN, message: "须以小写字母开头，仅含小写字母、数字、下划线" },
        ],
        // 标识创建后不可修改，仅编辑态禁用
        disabled: isEdit,
      },
      {
        label: "流程描述",
        prop: "description",
        type: "custom",
        render: <Input.TextArea rows={3} placeholder="请输入流程描述" />,
      },
    ];

    return {
      title: "流程",
      component: "modal",
      width: 560,
      pk: "id",
      formItems,
      formAction: async (data) => {
        if (data.id) {
          await WorkflowAPI.model.update(data.id, data);
          return;
        }
        await WorkflowAPI.model.create(data);
      },
    };
  }, []);

  const crud = useCrudPage<WorkflowModelItem, WorkflowModelQueryParams, ModelFormPayload>({
    table: tableConfig,
    modal: modalConfig,
    initialParams: { keywords: "" },
    search: {
      permPrefix: "workflow:model",
      formItems: [
        { type: "input", label: "关键字", prop: "keywords", attrs: { placeholder: "流程名称" } },
      ],
    },
    onToolbarClick: (name) => {
      if (name === "reset_demo") handleResetDemo();
    },
    onOperate: (name, row) => {
      if (name === "design") {
        const path = findRoutePathByComponent(menuRoutes, "workflow/designer");
        if (!path) {
          message.error("路由未注册，请检查菜单配置后重试");
          return;
        }
        navigate({
          pathname: path,
          search: `?${new URLSearchParams({
            modelId: row.id,
            title: `【${row.name}】流程设计`,
          }).toString()}`,
        });
        return;
      }
      if (name === "deploy") {
        handleDeploy(row.id);
        return;
      }
      if (name === "diagram") openDiagram(row);
    },
  });

  const { openEdit, tableProps } = crud;
  openEditRef.current = (row) => {
    void openEdit(row);
  };
  reloadRef.current = tableProps.refresh;

  return (
    <div className="page-container">
      <CrudTable<WorkflowModelItem, WorkflowModelQueryParams>
        {...tableProps}
        toolbarExtraRight={
          <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
            <Button
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
            />
          </Tooltip>
        }
      />

      {crud.modalProps && <CrudModal {...crud.modalProps} />}

      {/* 流程图弹窗：渲染已发布版本的 BPMN（只读，滚轮缩放） */}
      <Modal
        width={960}
        open={Boolean(diagram)}
        title={diagram?.title}
        footer={null}
        destroyOnHidden
        onCancel={() => setDiagram(undefined)}
      >
        <div className="workflow-diagram">
          {diagram?.xml ? <BpmnViewer xml={diagram.xml} /> : null}
        </div>
      </Modal>
    </div>
  );
}

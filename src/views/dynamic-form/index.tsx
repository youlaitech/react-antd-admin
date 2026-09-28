import { useCallback, useMemo, useRef, useState } from "react";
import { App as AntdApp, Button, Input, Tag, Tooltip } from "antd";
import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import FormAPI from "@/api/form";
import type { FormDefinitionData, FormDefinitionItem, FormDefinitionQueryParams } from "@/api/form";
import { CrudModal, CrudTable, useCrudPage } from "@/components/Crud";
import type { CrudFormItem, CrudModalConfig, CrudTableConfig } from "@/components/Crud";
import { FormCategory, FormStatus } from "@/enums";
import { useFullscreen } from "@/hooks/useFullscreen";
import { findRoutePathByComponent } from "@/router/menu";
import { usePermissionStore } from "@/stores/permission";
import PublishDialog from "./components/PublishDialog";

/** 状态下拉与标签展示映射 */
const STATUS_LABELS: Record<number, string> = {
  [FormStatus.DRAFT]: "草稿",
  [FormStatus.PUBLISHED]: "已发布",
  [FormStatus.DISABLED]: "已停用",
};

/** 类型下拉展示映射 */
const CATEGORY_LABELS: Record<string, string> = {
  [FormCategory.NORMAL]: "普通表单",
  [FormCategory.WORKFLOW]: "工作流表单",
};

/** 表单标识只允许小写字母、数字与下划线，且以字母开头 */
const FORM_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

/**
 * 状态标签颜色
 */
function statusColor(status: number) {
  if (status === FormStatus.PUBLISHED) return "success";
  if (status === FormStatus.DISABLED) return "error";
  return "default";
}

/** 表单定义列表页 */
export default function FormDefinitionPage() {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const menuRoutes = usePermissionStore((state) => state.menuRoutes);

  /** 当前类型过滤值，用于标注工作流标签与新增时的预选 */
  const [category, setCategory] = useState("");
  /** 正在编辑的表单状态：非草稿时类型作为业务标识不可修改 */
  const [editingStatus, setEditingStatus] = useState<FormStatus | null>(null);
  /** 发布向导的目标表单，null 表示未打开 */
  const [publishTarget, setPublishTarget] = useState<FormDefinitionItem | null>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  // openEdit 由 useCrudPage 返回，而它需要先拿到 onOperate 回调，用 ref 承接
  const openEditRef = useRef<(row: FormDefinitionItem) => void>(() => undefined);

  /** 按组件路径反查菜单路径后跳转，菜单没配时给出明确提示 */
  const gotoPage = useCallback(
    (component: string, query: Record<string, string>) => {
      const path = findRoutePathByComponent(menuRoutes, component);
      if (!path) {
        message.error("路由未注册，请检查菜单配置后重试");
        return;
      }
      navigate({ pathname: path, search: `?${new URLSearchParams(query).toString()}` });
    },
    [menuRoutes, message, navigate]
  );

  /** 停用表单：已发出去的访问入口立即失效，已提交数据保留 */
  const handleDisable = useCallback(
    (id: string) => {
      modal.confirm({
        title: "警告",
        content: "停用后表单立即不可访问，已提交数据保留，确定停用?",
        okButtonProps: { danger: true },
        onOk: async () => {
          await FormAPI.disable(id);
          message.success("已停用");
        },
      });
    },
    [message, modal]
  );

  const tableConfig: CrudTableConfig<FormDefinitionItem, FormDefinitionQueryParams> = useMemo(
    () => ({
      permPrefix: "form",
      pk: "id",
      toolbar: ["add", "delete"],
      defaultToolbar: ["refresh"],
      cols: [
        { type: "selection", width: 55, align: "center" },
        {
          label: "表单名称",
          prop: "formName",
          width: 200,
          render: (row) => (
            <span className="form-name">
              <span className="form-name__text">{row.formName}</span>
              {/* 类型标签只在"全部"视图标注工作流，避免与类型过滤重复 */}
              {!category && row.category === FormCategory.WORKFLOW && (
                <Tag color="success" variant="outlined">
                  工作流
                </Tag>
              )}
              {row.isPublic === 1 && (
                <Tag color="warning" variant="outlined">
                  公开
                </Tag>
              )}
            </span>
          ),
        },
        { label: "表单标识", prop: "formKey", width: 160 },
        { label: "描述", prop: "description", width: 160 },
        {
          label: "状态",
          prop: "status",
          width: 90,
          align: "center",
          render: (row) => (
            <Tag color={statusColor(row.status)}>{STATUS_LABELS[row.status] ?? "未知"}</Tag>
          ),
        },
        { label: "版本", prop: "version", width: 70, align: "center" },
        { label: "创建时间", prop: "createTime", width: 170, align: "center" },
        {
          label: "操作",
          align: "center",
          width: 320,
          templet: "tool",
          operat: [
            { name: "design", text: "设计" },
            {
              name: "data",
              text: "数据",
              render: (row) => Number(row.status) === FormStatus.PUBLISHED,
            },
            {
              name: "publish",
              // 同一个按钮按状态换文案：未发布是「发布」，已发布是「入口管理」
              text: (row) => (Number(row.status) === FormStatus.PUBLISHED ? "入口管理" : "发布"),
            },
            { name: "edit_meta", text: "编辑" },
            {
              name: "disable",
              text: "停用",
              danger: true,
              render: (row) => Number(row.status) === FormStatus.PUBLISHED,
            },
            "delete",
          ],
        },
      ],
      indexAction: (params) => FormAPI.getPage(params),
      deleteAction: (ids) => FormAPI.deleteByIds(ids),
    }),
    [category]
  );

  /** 新增弹窗按当前过滤视图预选类型 */
  const createDefaults = useCallback(
    () => ({
      category: category === FormCategory.WORKFLOW ? FormCategory.WORKFLOW : FormCategory.NORMAL,
    }),
    [category]
  );

  const modalConfig = useCallback(
    (isEdit: boolean): CrudModalConfig<FormDefinitionData> => {
      const categoryDisabled =
        isEdit && editingStatus !== null && editingStatus !== FormStatus.DRAFT;

      const formItems: CrudFormItem[] = [
        {
          label: "表单名称",
          prop: "formName",
          type: "input",
          required: true,
          placeholder: "请输入表单名称",
        },
        {
          label: "表单标识",
          prop: "formKey",
          type: "input",
          required: true,
          disabled: isEdit,
          placeholder: "如 employee_onboarding",
          tip: "创建后不可修改，建议用有业务含义的英文编码",
          rules: [
            { pattern: FORM_KEY_PATTERN, message: "须以小写字母开头，仅含小写字母、数字、下划线" },
          ],
        },
        {
          label: "表单类型",
          prop: "category",
          type: "select",
          required: true,
          disabled: categoryDisabled,
          placeholder: "请选择表单类型",
          tip: "普通表单用于公开收集或菜单挂载；工作流表单可被流程绑定为发起或办理表单",
          options: Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ label, value })),
        },
        {
          label: "表单描述",
          prop: "description",
          type: "custom",
          render: <Input.TextArea rows={3} placeholder="请输入表单描述" />,
        },
      ];

      return {
        title: "表单",
        component: "modal",
        width: 560,
        pk: "id",
        formItems,
        detailAction: (id) => FormAPI.getFormData(id),
        formAction: async (data) => {
          if (!data.id) {
            await FormAPI.create(data);
            return;
          }
          // 只提交元数据：回显数据含 formJson/optionsJson，整体回写会覆盖期间设计器保存的新规则
          const { formKey, formName, category: formCategory, description } = data;
          await FormAPI.update(data.id, {
            formKey,
            formName,
            category: formCategory,
            description,
          });
        },
      };
    },
    [editingStatus]
  );

  const crud = useCrudPage<FormDefinitionItem, FormDefinitionQueryParams, FormDefinitionData>({
    table: tableConfig,
    createDefaults,
    initialParams: { keywords: "", category: "" },
    search: {
      permPrefix: "form",
      formItems: [
        {
          type: "input",
          label: "关键字",
          prop: "keywords",
          attrs: { placeholder: "表单名称/标识" },
        },
        {
          type: "radio",
          label: "类型",
          prop: "category",
          initialValue: "",
          options: [
            { label: "全部", value: "" },
            ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ label, value })),
          ],
        },
        {
          type: "select",
          label: "状态",
          prop: "status",
          options: Object.entries(STATUS_LABELS).map(([value, label]) => ({
            label,
            value: Number(value),
          })),
          attrs: { placeholder: "全部", style: { width: 160 } },
        },
      ],
    },
    modal: modalConfig,
    onOperate: (name, row) => {
      if (name === "design") {
        gotoPage("dynamic-form/designer", { id: row.id, title: `【${row.formName}】表单设计` });
        return;
      }
      if (name === "data") {
        gotoPage("dynamic-form/data", { formKey: row.formKey, title: `【${row.formName}】数据` });
        return;
      }
      if (name === "publish") {
        setPublishTarget(row);
        return;
      }
      if (name === "edit_meta") {
        // 记下状态用于判断类型可否修改，再交给封装打开编辑弹窗
        setEditingStatus(row.status);
        openEditRef.current(row);
        return;
      }
      if (name === "disable") handleDisable(row.id);
    },
  });

  const { openEdit, tableProps } = crud;
  openEditRef.current = (row) => {
    void openEdit(row);
  };

  return (
    <div className="page-container">
      <CrudTable<FormDefinitionItem, FormDefinitionQueryParams>
        {...tableProps}
        // 查询与重置都顺手把类型过滤同步给页面，供工作流标签与新增预选使用
        onQuery={(values) => {
          setCategory(String(values.category ?? ""));
          tableProps.onQuery(values);
        }}
        onReset={(values) => {
          setCategory(String(values.category ?? ""));
          tableProps.onReset(values);
        }}
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

      {publishTarget && (
        <PublishDialog
          open
          formId={publishTarget.id}
          formKey={publishTarget.formKey}
          formName={publishTarget.formName}
          status={publishTarget.status}
          isPublic={publishTarget.isPublic}
          onClose={() => setPublishTarget(null)}
          // 发布后状态与版本可能已变更，重新拉列表
          onSuccess={crud.reload}
        />
      )}
    </div>
  );
}

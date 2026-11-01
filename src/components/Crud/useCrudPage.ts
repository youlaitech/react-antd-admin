import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App as AntdApp, Form } from "antd";
import { useTranslation } from "react-i18next";

import { validateForm } from "@/utils/form";
import type {
  CrudModalConfig,
  CrudModalMode,
  CrudQueryParams,
  CrudRecord,
  CrudSearchConfig,
  CrudTableConfig,
} from "./types";

/**
 * 泛型说明
 * 两者都只约束到 object，避免 interface 类型赋不进 Record<string, unknown>
 */
interface UseCrudPageOptions<T extends object, Q extends CrudQueryParams, M extends object = T> {
  /** 表格配置 */
  table: CrudTableConfig<T, Q>;
  /** 弹窗配置，不传则只提供列表能力 */
  modal?: CrudModalConfig<M> | ((isEdit: boolean) => CrudModalConfig<M>);
  /** 搜索区配置 */
  search?: CrudSearchConfig;
  /** 初始查询参数 */
  initialParams?: Partial<Q>;
  /** 新增弹窗的默认值，如按当前过滤视图预选类型 */
  createDefaults?: () => CrudRecord;
  /** 自定义行内操作，编辑与删除已由封装接管 */
  onOperate?: (name: string, row: T) => void;
  /** 自定义工具栏点击 */
  onToolbarClick?: (name: string) => void;
}

/**
 * 列表页通用状态
 */
export function useCrudPage<T extends object, Q extends CrudQueryParams, M extends object = T>(
  options: UseCrudPageOptions<T, Q, M>,
) {
  const { table, modal: modalConfig, search, initialParams } = options;
  const onOperate = options.onOperate;
  const onToolbarClick = options.onToolbarClick;
  const createDefaults = options.createDefaults;
  const { t } = useTranslation();
  const { message, modal: antdModal } = AntdApp.useApp();

  const [form] = Form.useForm<CrudRecord>();

  const pk = table.pk ?? "id";
  const showPagination = table.pagination !== false;

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchValues, setSearchValues] = useState<CrudRecord>({});
  // 表头筛选条件，与搜索条件一起参与每次查询
  const [filterValues, setFilterValues] = useState<CrudRecord>({});
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  // 手动刷新标记：查询条件不变时也要能重新拉数据
  const [refreshTick, setRefreshTick] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<CrudModalMode>("create");
  const [editingId, setEditingId] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  // 配置对象在页面上多半是字面量，每次渲染都是新引用
  const tableRef = useRef(table);
  const initialParamsRef = useRef(initialParams);
  const modalConfigRef = useRef(modalConfig);
  // 只接受最后一次列表请求的结果
  const listRequestSeqRef = useRef(0);
  tableRef.current = table;
  initialParamsRef.current = initialParams;
  modalConfigRef.current = modalConfig;

  // 取出当前编辑态对应的弹窗配置
  const resolveModalConfig = useCallback((isEdit: boolean) => {
    const value = modalConfigRef.current;
    if (!value) return undefined;
    return typeof value === "function" ? value(isEdit) : value;
  }, []);

  // 列表与远程导出共用同一份查询条件
  const buildQueryParams = useCallback(
    () =>
      ({
        ...initialParamsRef.current,
        ...searchValues,
        ...filterValues,
        ...(showPagination ? { pageNum, pageSize } : {}),
      }) as Q,
    [pageNum, pageSize, searchValues, filterValues, showPagination],
  );

  // 重新拉取当前条件下的分页数据
  const fetchList = useCallback(async () => {
    const requestSeq = ++listRequestSeqRef.current;
    setLoading(true);
    try {
      const data = await tableRef.current.indexAction(buildQueryParams());
      if (requestSeq !== listRequestSeqRef.current) return;

      setList((data.list ?? []) as T[]);
      setTotal(data.total ?? 0);
    } finally {
      if (requestSeq === listRequestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [buildQueryParams]);

  useEffect(() => {
    void fetchList().catch(() => undefined);

    return () => {
      listRequestSeqRef.current += 1;
    };
  }, [fetchList, refreshTick]);

  // 保持当前条件重新查询
  const reload = useCallback(() => setRefreshTick((tick) => tick + 1), []);

  // 搜索：条件与页码一起变，回到第一页
  const handleQuery = useCallback((values: CrudRecord) => {
    setSearchValues(values);
    setPageNum(1);
    setRefreshTick((tick) => tick + 1);
  }, []);

  // 重置：表单已由 CrudSearch 清空，这里只同步查询条件
  const handleReset = useCallback((values: CrudRecord) => {
    setSearchValues(values);
    setPageNum(1);
    setRefreshTick((tick) => tick + 1);
  }, []);

  // 表头筛选变化
  const handleFilterChange = useCallback((values: CrudRecord) => {
    setFilterValues(values);
    setPageNum(1);
    setRefreshTick((tick) => tick + 1);
  }, []);

  // 删除：不传主键时删勾选项
  const handleDelete = useCallback(
    (ids?: string) => {
      const deleteAction = tableRef.current.deleteAction;
      if (!deleteAction) {
        message.error(t("crud.noDeleteAction"));
        return;
      }

      const target = ids ?? selectedRows.map((row) => String((row as CrudRecord)[pk])).join(",");
      if (!target) {
        message.warning(t("common.selectRequired"));
        return;
      }

      antdModal.confirm({
        title: t("common.tips"),
        content: t("crud.deleteConfirm"),
        okButtonProps: { danger: true },
        onOk: async () => {
          await deleteAction(target);
          message.success(t("common.deleteSuccess"));
          setSelectedRows([]);
          reload();
        },
      });
    },
    [antdModal, message, pk, reload, selectedRows, t],
  );

  // 打开新增弹窗
  const openCreate = useCallback(
    (defaultValues?: CrudRecord) => {
      setEditingId(undefined);
      setModalMode("create");
      form.resetFields();
      // 页面没显式给值时用配置里的默认值
      const values = defaultValues ?? createDefaultsRef.current?.();
      if (values) form.setFieldsValue(values);
      setModalOpen(true);
    },
    [form],
  );

  /**
   * 打开弹窗并回显：编辑可改，查看只读
   */
  const openWithRow = useCallback(
    async (row: T, mode: Exclude<CrudModalMode, "create">) => {
      const id = String((row as CrudRecord)[pk]);
      setEditingId(id);
      setModalMode(mode);
      form.resetFields();
      setModalOpen(true);

      const detailAction = resolveModalConfig(true)?.detailAction;
      if (!detailAction) {
        form.setFieldsValue(row as CrudRecord);
        return;
      }

      try {
        form.setFieldsValue((await detailAction(id)) as CrudRecord);
      } catch {
        // 请求层已提示错误
      }
    },
    [form, pk, resolveModalConfig],
  );

  // 打开编辑弹窗，配了 detailAction 时以详情接口为准
  const openEdit = useCallback((row: T) => openWithRow(row, "edit"), [openWithRow]);

  // 打开查看弹窗，字段全部只读
  const openView = useCallback((row: T) => openWithRow(row, "view"), [openWithRow]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(undefined);
    form.resetFields();
  }, [form]);

  // 提交弹窗表单，查看态不写库
  const submitModal = useCallback(async () => {
    if (modalMode === "view") {
      closeModal();
      return;
    }

    const config = resolveModalConfig(Boolean(editingId));
    if (!config?.submitForm && !config?.formAction) {
      message.error(t("crud.noFormAction"));
      return;
    }

    const values = await validateForm(form);
    if (!values) return;

    const payload = {
      ...values,
      ...(editingId ? { [config.pk ?? "id"]: editingId } : {}),
    } as unknown as M;

    setSubmitting(true);
    try {
      const data = config.beforeSubmit ? config.beforeSubmit(payload) : payload;
      if (config.submitForm) {
        await config.submitForm(data, { mode: modalMode, id: editingId });
      } else {
        await config.formAction?.(data);
      }
      message.success(t("common.saveSuccess"));
      closeModal();
      reload();
    } finally {
      setSubmitting(false);
    }
  }, [closeModal, editingId, form, message, modalMode, reload, resolveModalConfig, t]);

  // 自定义回调每次渲染都是新引用，用 ref 承接避免拖累下面的依赖
  const onOperateRef = useRef(onOperate);
  const onToolbarClickRef = useRef(onToolbarClick);
  const createDefaultsRef = useRef(createDefaults);
  onOperateRef.current = onOperate;
  onToolbarClickRef.current = onToolbarClick;
  createDefaultsRef.current = createDefaults;

  // 行内操作，查看、编辑与删除由封装接管，其余交给页面
  const handleOperate = useCallback(
    (name: string, row: T) => {
      if (name === "delete") {
        handleDelete(String((row as CrudRecord)[pk]));
        return;
      }
      if (name === "edit") {
        openEdit(row);
        return;
      }
      if (name === "view") {
        openView(row);
        return;
      }
      onOperateRef.current?.(name, row);
    },
    [handleDelete, openEdit, openView, pk],
  );

  const tableProps = useMemo(
    () => ({
      config: table,
      searchConfig: search,
      loading,
      list,
      total,
      pageNum,
      pageSize,
      selectedRows,
      buildQueryParams,
      onPageChange: (nextPageNum: number, nextPageSize: number) => {
        setPageNum(nextPageNum);
        setPageSize(nextPageSize);
      },
      onSelectionChange: setSelectedRows,
      onToolbar: (name: string) => {
        if (name === "add") openCreate();
        else if (name === "delete") handleDelete();
      },
      onToolbarClick: (name: string) => {
        if (name === "refresh") reload();
        else onToolbarClickRef.current?.(name);
      },
      onOperate: handleOperate,
      onQuery: handleQuery,
      onReset: handleReset,
      onFilterChange: handleFilterChange,
      refresh: reload,
    }),
    [
      buildQueryParams,
      handleDelete,
      handleFilterChange,
      handleOperate,
      handleQuery,
      handleReset,
      list,
      loading,
      openCreate,
      pageNum,
      pageSize,
      reload,
      search,
      selectedRows,
      table,
      total,
    ],
  );

  const isEdit = Boolean(editingId);
  const currentModalConfig = resolveModalConfig(isEdit);

  const modalProps = useMemo(
    () =>
      currentModalConfig
        ? {
            config: currentModalConfig,
            form,
            open: modalOpen,
            mode: modalMode,
            isEdit,
            submitting,
            onClose: closeModal,
            onSubmit: submitModal,
          }
        : null,
    [closeModal, currentModalConfig, form, isEdit, modalMode, modalOpen, submitModal, submitting],
  );

  return {
    /** 列表状态 */
    loading,
    list,
    total,
    selectedRows,
    /** 透传给 CrudTable */
    tableProps,
    /** 透传给 CrudModal */
    modalProps,
    /** 手动刷新 */
    reload,
    /** 打开新增 / 编辑 / 查看弹窗 */
    openCreate,
    openEdit,
    openView,
    /** 删除指定主键 */
    handleDelete,
  };
}

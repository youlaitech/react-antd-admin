import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type DragEvent,
} from "react";
import {
  App as AntdApp,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Spin,
  Steps,
  Switch,
  Table,
  Tag,
  Tree,
  Typography,
  type TableProps,
} from "antd";
import {
  CopyOutlined,
  DesktopOutlined,
  DownloadOutlined,
  HolderOutlined,
  RobotOutlined,
} from "@ant-design/icons";

import GeneratorAPI from "@/api/codegen";
import type { FieldConfig, GenConfigForm, GeneratorPreviewItem } from "@/api/codegen";
import type { OptionItem } from "@/api/common";
import DictAPI from "@/api/system/dict";
import MenuAPI from "@/api/system/menu";
import CodeViewer from "@/components/CodeViewer";
import { FormTypeEnum, QueryTypeEnum, formTypeOptions, queryTypeOptions } from "@/enums";
import { appConfig } from "@/settings";
import AiDiffModal from "./components/AiDiffModal";
import WriteLocalDialog from "./components/WriteLocalDialog";
import { useAiFillDiff } from "./composables/useAiFillDiff";

/** 向导步骤 */
const STEP = { BASIC: 0, FIELD: 1, PREVIEW: 2 } as const;

const STEPS = [
  { title: "基础配置", description: "配置表信息和生成选项", nextText: "下一步，字段配置" },
  {
    title: "字段配置",
    description: "配置字段显示和表单类型",
    prevText: "上一步，基础配置",
    nextText: "下一步，确认生成",
  },
  {
    title: "预览生成",
    description: "预览代码并下载",
    prevText: "上一步，字段配置",
    nextText: "下载代码",
  },
];

/** 需要选择字典的表单类型 */
const DICT_FORM_TYPES = [
  FormTypeEnum.SELECT.value,
  FormTypeEnum.RADIO.value,
  FormTypeEnum.CHECK_BOX.value,
];

/** 可批量开关的字段属性 */
const BULK_ITEMS = [
  { key: "isShowInList", label: "列表" },
  { key: "isShowInForm", label: "表单" },
  { key: "isShowInQuery", label: "查询" },
] as const;

interface GeneratorDrawerProps {
  /** 目标表名，有值时抽屉打开 */
  tableName?: string;
  /** 关闭 */
  onClose: () => void;
  /** 配置保存成功后通知列表刷新（表的已配置标记会变） */
  onSuccess?: () => void;
}

/** 预览文件树节点 */
interface FileNode {
  title: string;
  key: string;
  isLeaf?: boolean;
  children?: FileNode[];
}

/** 文件类型：优先用后端给的语言标记，缺省退回扩展名 */
function fileTypeOf(file: GeneratorPreviewItem) {
  return file.language || file.fileName.split(".").pop() || "";
}

/** 代码生成向导 */
export default function GeneratorDrawer({ tableName, onClose, onSuccess }: GeneratorDrawerProps) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<GenConfigForm>();
  const aiDiff = useAiFillDiff();

  const [step, setStep] = useState<number>(STEP.BASIC);
  const [config, setConfig] = useState<GenConfigForm>({ fieldConfigs: [] });
  const [menuOptions, setMenuOptions] = useState<OptionItem[]>([]);
  const [dictOptions, setDictOptions] = useState<OptionItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [files, setFiles] = useState<GeneratorPreviewItem[]>([]);
  const [currentFileKey, setCurrentFileKey] = useState<string>();
  const [scope, setScope] = useState<"all" | "frontend" | "backend">("all");
  /** 文件类型过滤，空数组表示不过滤 */
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [writeLocalOpen, setWriteLocalOpen] = useState(false);

  const open = Boolean(tableName);

  /**
   * 日期类型字段默认用范围查询，比较符合直觉
   * 只在查询类型为空时补，避免覆盖用户的选择
   */
  const applyDateQueryDefault = useCallback((list?: FieldConfig[]) => {
    (list ?? []).forEach((field) => {
      const isDate =
        field.fieldType?.includes("Date") ||
        field.formType === FormTypeEnum.DATE.value ||
        field.formType === FormTypeEnum.DATE_TIME.value;

      if (isDate && field.isShowInQuery === 1 && field.queryType == null) {
        field.queryType = QueryTypeEnum.BETWEEN.value as number;
      }
    });
    return list ?? [];
  }, []);

  /** 加载菜单、字典与生成配置 */
  const loadConfig = useCallback(
    async (name: string) => {
      const [menuList, dictList, data] = await Promise.all([
        MenuAPI.getParentOptions(),
        DictAPI.getOptions(),
        GeneratorAPI.getGenConfig(name),
      ]);

      setMenuOptions(menuList);
      setDictOptions(dictList);

      // 未保存过的表页面类型为空，统一补成普通表单
      const next: GenConfigForm = {
        ...data,
        fieldConfigs: data.fieldConfigs ?? [],
        pageType: data.pageType || "classic",
      };
      next.fieldConfigs = applyDateQueryDefault(next.fieldConfigs);

      setConfig(next);
      form.setFieldsValue(next);
      return next;
    },
    [applyDateQueryDefault, form]
  );

  /** 拉取预览代码 */
  const doPreview = useCallback(async (name: string, pageType?: GenConfigForm["pageType"]) => {
    const data = await GeneratorAPI.getPreviewData(name, { pageType });
    setFiles(data);
    const first = data[0];
    setCurrentFileKey(first ? `${first.scope}/${first.path}/${first.fileName}` : undefined);
  }, []);

  // 打开时加载配置：已配置过的表直达预览
  useEffect(() => {
    if (!tableName) return;

    setStep(STEP.BASIC);
    setScope("all");
    setFiles([]);
    setLoading(true);

    loadConfig(tableName)
      .then(async (next) => {
        if (next.id) {
          setStep(STEP.PREVIEW);
          await doPreview(tableName, next.pageType);
        }
      })
      .catch(() => {
        message.error("获取生成配置失败");
        onClose();
      })
      .finally(() => setLoading(false));
  }, [doPreview, loadConfig, message, onClose, tableName]);

  /** 校验基础配置必填项 */
  const validateBasic = useCallback(() => {
    const { tableName: table, packageName, businessName, moduleName, entityName } = config;
    if (!table || !packageName || !businessName || !moduleName || !entityName) {
      message.error("表名、业务名、包名、模块名、实体名不能为空");
      return false;
    }
    return true;
  }, [config, message]);

  /** 更新基础配置，同时同步到表单与状态 */
  const patchConfig = (values: Partial<GenConfigForm>) => {
    setConfig((prev) => ({ ...prev, ...values }));
    form.setFieldsValue(values);
  };

  /** 更新单个字段配置 */
  const patchField = (index: number, values: Partial<FieldConfig>) => {
    setConfig((prev) => {
      const list = [...(prev.fieldConfigs ?? [])];
      list[index] = { ...list[index], ...values };
      return { ...prev, fieldConfigs: applyDateQueryDefault(list) };
    });
  };

  /** 批量设置字段开关 */
  const bulkSet = (key: "isShowInQuery" | "isShowInList" | "isShowInForm", value: 0 | 1) => {
    setConfig((prev) => ({
      ...prev,
      fieldConfigs: (prev.fieldConfigs ?? []).map((field) => ({ ...field, [key]: value })),
    }));
  };

  /** 字段开关的统计，便于一眼看出配置进度 */
  const fieldStats = useMemo(() => {
    const list = config.fieldConfigs ?? [];
    return {
      total: list.length,
      list: list.filter((field) => field.isShowInList === 1).length,
      form: list.filter((field) => field.isShowInForm === 1).length,
      query: list.filter((field) => field.isShowInQuery === 1).length,
    };
  }, [config.fieldConfigs]);

  /** 拖拽换序要读最新字段列表，行组件要稳定，用 ref 承接 */
  const fieldListRef = useRef<FieldConfig[]>([]);
  fieldListRef.current = config.fieldConfigs ?? [];

  const dragIndexRef = useRef<number | null>(null);

  /** 字段行拖拽换序：悬停即换位，与列表拖拽同一套做法 */
  function handleFieldDragOver(index: number, event: DragEvent<HTMLElement>) {
    event.preventDefault();

    const from = dragIndexRef.current;
    if (from === null || from === index) return;

    setConfig((prev) => {
      const list = [...(prev.fieldConfigs ?? [])];
      const [moved] = list.splice(from, 1);
      list.splice(index, 0, moved);
      return { ...prev, fieldConfigs: list };
    });
    dragIndexRef.current = index;
  }

  /** 可拖拽的字段行：换序即调整生成顺序，保存时按数组顺序提交 */
  const fieldRowComponents = useMemo(() => {
    function FieldRow(props: ComponentPropsWithoutRef<"tr"> & { "data-row-key"?: string }) {
      const { className, ...rest } = props;
      const index = fieldListRef.current.findIndex(
        (field) => String(field.columnName) === props["data-row-key"]
      );

      return (
        <tr
          {...rest}
          className={`gen-field__row ${className ?? ""}`.trim()}
          draggable
          onDragStart={() => {
            dragIndexRef.current = index;
          }}
          onDragOver={(event) => handleFieldDragOver(index, event)}
          onDragEnd={() => {
            dragIndexRef.current = null;
          }}
        />
      );
    }

    return { body: { row: FieldRow } };
  }, []);

  /** AI 推断：按表结构重建配置，落到字段配置步骤核对 */
  const handleAiFill = async () => {
    if (!tableName) return;

    // 推断会整体覆盖配置，先留一份快照用于比对与撤销
    aiDiff.takeSnapshot(config);

    setAiLoading(true);
    try {
      const filled = await GeneratorAPI.aiFillConfig(tableName);
      // 接口可能不返回页面类型，沿用当前选择
      const next: GenConfigForm = {
        ...filled,
        pageType: filled.pageType || config.pageType || "classic",
      };
      next.fieldConfigs = applyDateQueryDefault(next.fieldConfigs);

      setConfig(next);
      form.setFieldsValue(next);
      setStep(STEP.FIELD);

      const result = aiDiff.resolveDiff(next);
      message.success(
        result?.changeCount
          ? `推断完成，共 ${result.fieldCount} 个字段、${result.changeCount} 处改动`
          : "推断完成，配置无变化"
      );
    } catch {
      // 业务异常已由请求拦截器统一提示（含 AI 未开启的具体原因）
    } finally {
      setAiLoading(false);
    }
  };

  /** 撤销 AI 推断：整体回到推断前那一版 */
  const handleUndoAiFill = () => {
    const restored = aiDiff.undo();
    if (!restored) return;

    setConfig(restored);
    form.setFieldsValue(restored);
    message.info("已撤销 AI 填充");
  };

  /**
   * 从改动明细定位到字段
   * 需要等字段表格渲染完成后再滚动，否则查不到行
   */
  const locateField = (columnName: string) => {
    setStep(STEP.FIELD);
    aiDiff.setDiffOpen(false);

    window.setTimeout(() => {
      const row = document.querySelector(`tr[data-row-key="${columnName}"]`);
      if (!row) return;

      row.scrollIntoView({ block: "center", behavior: "smooth" });
      row.classList.add("gen-field__row--highlight");
      window.setTimeout(() => row.classList.remove("gen-field__row--highlight"), 2000);
    }, 100);
  };

  /** 进入下一步：字段配置先保存配置再生成预览 */
  const handleNext = async () => {
    if (!tableName) return;

    if (step === STEP.BASIC) {
      if (!validateBasic()) return;
      setStep(STEP.FIELD);
      return;
    }

    if (step === STEP.FIELD) {
      setLoading(true);
      try {
        await GeneratorAPI.saveGenConfig(tableName, config);
        // 保存后表的「已配置」标记会变，通知列表刷新
        onSuccess?.();
        await doPreview(tableName, config.pageType);
        setStep(STEP.PREVIEW);
      } catch {
        message.error("代码生成失败");
      } finally {
        setLoading(false);
      }
      return;
    }

    await GeneratorAPI.download(tableName, { pageType: config.pageType, type: "ts" });
  };

  /** 回到上一步：从预览回退要重新拉配置，否则字段列表是上一轮的残留 */
  const handlePrev = async () => {
    if (!tableName) return;

    if (step === STEP.PREVIEW) {
      setLoading(true);
      try {
        await loadConfig(tableName);
      } finally {
        setLoading(false);
      }
    }

    setStep((prev) => Math.max(prev - 1, STEP.BASIC));
  };

  /** 按范围过滤预览文件 */
  const scopedFiles = useMemo(
    () => (scope === "all" ? files : files.filter((file) => file.scope === scope)),
    [files, scope]
  );

  /** 文件类型选项：由预览结果动态提取，避免写死语言列表 */
  const typeOptions = useMemo(() => {
    const types = new Set<string>();
    scopedFiles.forEach((file) => types.add(fileTypeOf(file)));
    return Array.from(types)
      .sort()
      .map((value) => ({ label: value, value }));
  }, [scopedFiles]);

  /** 类型过滤后的文件，未选类型时全部保留 */
  const visibleFiles = useMemo(
    () =>
      typeFilter.length
        ? scopedFiles.filter((file) => typeFilter.includes(fileTypeOf(file)))
        : scopedFiles,
    [scopedFiles, typeFilter]
  );

  /** 预览文件树：路径按层级拆分 */
  const treeData = useMemo(() => {
    const root: FileNode[] = [];

    visibleFiles.forEach((file) => {
      const segments = file.path.split("/").filter(Boolean);
      let level = root;

      segments.forEach((segment) => {
        let node = level.find((item) => item.title === segment && !item.isLeaf);
        if (!node) {
          node = { title: segment, key: `dir:${segment}`, children: [] };
          level.push(node);
        }
        level = node.children as FileNode[];
      });

      level.push({
        title: file.fileName,
        key: `${file.scope}/${file.path}/${file.fileName}`,
        isLeaf: true,
      });
    });

    return root;
  }, [visibleFiles]);

  /** 当前预览的文件内容 */
  const currentFile = scopedFiles.find(
    (file) => `${file.scope}/${file.path}/${file.fileName}` === currentFileKey
  );

  /** 复制当前文件代码 */
  const handleCopyCode = () => {
    if (!currentFile) return;

    navigator.clipboard
      ?.writeText(currentFile.content)
      .then(() => message.success("已复制到剪贴板"))
      .catch(() => message.warning("复制失败，请手动选择复制"));
  };

  /** 下载整包代码：后端按包名打成 ZIP 返回 */
  const handleDownloadZip = async () => {
    if (!tableName) return;

    setDownloading(true);
    try {
      await GeneratorAPI.download(tableName, { pageType: config.pageType, type: "ts" });
    } finally {
      setDownloading(false);
    }
  };

  /** 字段配置表格列 */
  const fieldColumns: TableProps<FieldConfig>["columns"] = [
    {
      title: "字段",
      width: 200,
      render: (_, row) => (
        // 整行可拖拽，这里给个抓手提示可换序
        <div className="gen-field__cell">
          <HolderOutlined className="gen-field__handle" />
          <div className="gen-field__meta">
            <div className="gen-field__name">
              {row.fieldName}
              {/* 被 AI 改过的字段打个标记，便于逐项核对 */}
              {aiDiff.changedColumns.has(String(row.columnName)) && (
                <Tag color="processing" className="gen-field__ai-tag">
                  AI
                </Tag>
              )}
            </div>
            <div className="gen-field__column">{row.columnName}</div>
          </div>
        </div>
      ),
    },
    {
      title: "描述",
      width: 160,
      render: (_, row, index) => (
        <Input
          size="small"
          value={row.fieldComment}
          onChange={(event) => patchField(index, { fieldComment: event.target.value })}
        />
      ),
    },
    { title: "类型", dataIndex: "fieldType", width: 110, ellipsis: true },
    {
      title: "列表",
      width: 64,
      align: "center",
      render: (_, row, index) => (
        <Switch
          size="small"
          checked={row.isShowInList === 1}
          onChange={(checked) => patchField(index, { isShowInList: checked ? 1 : 0 })}
        />
      ),
    },
    {
      title: "表单",
      width: 64,
      align: "center",
      render: (_, row, index) => (
        <Switch
          size="small"
          checked={row.isShowInForm === 1}
          onChange={(checked) => patchField(index, { isShowInForm: checked ? 1 : 0 })}
        />
      ),
    },
    {
      title: "查询",
      width: 64,
      align: "center",
      render: (_, row, index) => (
        <Switch
          size="small"
          checked={row.isShowInQuery === 1}
          onChange={(checked) => patchField(index, { isShowInQuery: checked ? 1 : 0 })}
        />
      ),
    },
    {
      title: "必填",
      width: 64,
      align: "center",
      render: (_, row, index) => (
        <Switch
          size="small"
          disabled={row.isShowInForm !== 1}
          checked={row.isRequired === 1}
          onChange={(checked) => patchField(index, { isRequired: checked ? 1 : 0 })}
        />
      ),
    },
    {
      title: "表单类型",
      width: 140,
      render: (_, row, index) => (
        <Select
          size="small"
          className="w-full"
          value={row.formType}
          placeholder="请选择"
          options={formTypeOptions}
          onChange={(value) => patchField(index, { formType: value })}
        />
      ),
    },
    {
      title: "查询类型",
      width: 150,
      render: (_, row, index) => (
        <Select
          size="small"
          allowClear
          className="w-full"
          value={row.queryType}
          placeholder="请选择"
          disabled={row.isShowInQuery !== 1}
          options={queryTypeOptions}
          onChange={(value) => patchField(index, { queryType: value })}
        />
      ),
    },
    {
      title: "字典",
      width: 150,
      render: (_, row, index) =>
        DICT_FORM_TYPES.includes(Number(row.formType)) ? (
          <Select
            size="small"
            allowClear
            showSearch
            className="w-full"
            value={row.dictType}
            placeholder="请选择"
            optionFilterProp="label"
            options={dictOptions.map((item) => ({ label: item.label, value: String(item.value) }))}
            onChange={(value) => patchField(index, { dictType: value })}
          />
        ) : null,
    },
    {
      title: "排序",
      width: 90,
      render: (_, row, index) => (
        <InputNumber
          size="small"
          value={row.fieldSort}
          onChange={(value) => patchField(index, { fieldSort: value ?? undefined })}
        />
      ),
    },
  ];

  /** 关闭抽屉：顺手清掉 AI 改动记录，下次打开是干净状态 */
  const handleClose = () => {
    aiDiff.clear();
    onClose();
  };

  /** 底部按钮 */
  const footer = (
    <div className="gen-drawer__footer">
      <div>{step > STEP.BASIC && <Button onClick={handlePrev}>{STEPS[step].prevText}</Button>}</div>
      <Space>
        <Button onClick={handleClose}>取消</Button>
        <Button
          type="primary"
          loading={loading}
          icon={step === STEP.PREVIEW ? <DownloadOutlined /> : undefined}
          onClick={handleNext}
        >
          {STEPS[step].nextText}
        </Button>
      </Space>
    </div>
  );

  return (
    <Drawer
      width="90%"
      open={open}
      title={tableName ? `${tableName} 代码生成` : ""}
      footer={footer}
      destroyOnHidden
      onClose={handleClose}
    >
      <Steps
        current={step}
        size="small"
        className="gen-drawer__steps"
        items={STEPS.map((item) => ({ title: item.title, description: item.description }))}
      />

      {/* AI 入口：推断结果直接覆盖配置，核对后再保存 */}
      {appConfig.aiEnabled && step !== STEP.PREVIEW && (
        <div className="gen-drawer__ai">
          <RobotOutlined className="gen-drawer__ai-icon" />
          <div className="gen-drawer__ai-text">
            <div className="gen-drawer__ai-title">AI 智能推断</div>
            <div className="gen-drawer__ai-desc">
              {aiDiff.hasDiff
                ? `已推断 ${aiDiff.diff?.fieldCount} 个字段、${aiDiff.diff?.changeCount} 处改动`
                : "根据表结构自动补全业务名、字段描述和表单/查询类型，推断结果会覆盖当前配置"}
            </div>
          </div>
          <Space size={8}>
            {aiDiff.hasDiff && (
              <>
                <Button size="small" onClick={() => aiDiff.setDiffOpen(true)}>
                  查看改动
                </Button>
                <Button size="small" onClick={handleUndoAiFill}>
                  撤销填充
                </Button>
              </>
            )}
            <Button type="primary" size="small" loading={aiLoading} onClick={handleAiFill}>
              {aiDiff.hasDiff ? "重新推断" : "开始推断"}
            </Button>
          </Space>
        </div>
      )}

      <Spin spinning={loading} wrapperClassName="gen-drawer__content">
        {/* ① 基础配置 */}
        {step === STEP.BASIC && (
          <Form
            form={form}
            className="gen-drawer__form"
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 12 }}
            onValuesChange={(_, values) => setConfig((prev) => ({ ...prev, ...values }))}
          >
            <Form.Item label="表名" required>
              <Input value={config.tableName} disabled />
            </Form.Item>
            <Form.Item label="业务名" name="businessName" required>
              <Input placeholder="如 用户" />
            </Form.Item>
            <Form.Item label="模块名" name="moduleName" required>
              <Input placeholder="如 system" />
            </Form.Item>
            <Form.Item label="包名" name="packageName" required>
              <Input placeholder="如 com.youlai.system" />
            </Form.Item>
            <Form.Item label="实体名" name="entityName" required>
              <Input placeholder="如 User" />
            </Form.Item>
            <Form.Item label="表前缀" name="removeTablePrefix">
              <Input
                placeholder="如 sys_，配置后自动推导实体名"
                onChange={(event) => {
                  // 按前缀推导实体名，省去手工改名
                  const prefix = event.target.value;
                  const table = config.tableName ?? "";
                  const base = table.startsWith(prefix) ? table.slice(prefix.length) : table;
                  const camel = base
                    .split("_")
                    .filter(Boolean)
                    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                    .join("");

                  patchConfig({ removeTablePrefix: prefix, entityName: camel });
                }}
              />
            </Form.Item>
            <Form.Item label="上级菜单" name="parentMenuId">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="生成后挂载到哪个菜单下"
                options={menuOptions.map((item) => ({
                  label: item.label,
                  value: String(item.value),
                }))}
              />
            </Form.Item>
            <Form.Item label="作者" name="author">
              <Input placeholder="生成文件的 @author" />
            </Form.Item>
            <Form.Item label="页面类型" name="pageType">
              <Radio.Group
                optionType="button"
                options={[
                  { label: "普通表单", value: "classic" },
                  { label: "增删改查", value: "crud" },
                ]}
              />
            </Form.Item>
            <Form.Item label="后端应用" name="backendAppName">
              <Input placeholder="如 youlai-boot" />
            </Form.Item>
            <Form.Item label="前端应用" name="frontendAppName">
              <Input placeholder="如 react-antd-admin" />
            </Form.Item>
          </Form>
        )}

        {/* ② 字段配置 */}
        {step === STEP.FIELD && (
          <div>
            <Space className="gen-drawer__bulk" wrap>
              <span className="gen-drawer__bulk-label">批量设置</span>
              {BULK_ITEMS.map((item) => (
                <Space.Compact key={item.key}>
                  <Button size="small" onClick={() => bulkSet(item.key, 1)}>
                    全选{item.label}
                  </Button>
                  <Button size="small" onClick={() => bulkSet(item.key, 0)}>
                    全不选
                  </Button>
                </Space.Compact>
              ))}
              <Tag>字段 {fieldStats.total}</Tag>
              <Tag color="processing">列表 {fieldStats.list}</Tag>
              <Tag color="success">表单 {fieldStats.form}</Tag>
              <Tag color="warning">查询 {fieldStats.query}</Tag>
              <span className="gen-drawer__bulk-tip">拖拽行首可调整生成顺序</span>
            </Space>

            <Table<FieldConfig>
              rowKey={(row) => String(row.columnName)}
              size="small"
              columns={fieldColumns}
              dataSource={config.fieldConfigs ?? []}
              pagination={false}
              scroll={{ x: 1400, y: 380 }}
              components={fieldRowComponents}
            />
          </div>
        )}

        {/* ③ 预览生成 */}
        {step === STEP.PREVIEW && (
          <div className="gen-drawer__preview">
            <div className="gen-drawer__preview-aside">
              <Radio.Group
                size="small"
                optionType="button"
                value={scope}
                className="gen-drawer__scope"
                onChange={(event) => setScope(event.target.value)}
                options={[
                  { label: "全部", value: "all" },
                  { label: "前端", value: "frontend" },
                  { label: "后端", value: "backend" },
                ]}
              />
              <Select
                mode="multiple"
                allowClear
                size="small"
                placeholder="文件类型"
                className="gen-drawer__types"
                value={typeFilter}
                maxTagCount="responsive"
                options={typeOptions}
                onChange={setTypeFilter}
              />
              <div className="gen-drawer__file-count">{visibleFiles.length} 个文件</div>
              <Tree
                treeData={treeData}
                defaultExpandAll
                selectedKeys={currentFileKey ? [currentFileKey] : []}
                onSelect={(keys) => {
                  const key = String(keys[0] ?? "");
                  if (key && !key.startsWith("dir:")) setCurrentFileKey(key);
                }}
              />
            </div>

            <div className="gen-drawer__preview-main">
              <div className="gen-drawer__preview-bar">
                <Typography.Text type="secondary" ellipsis>
                  {currentFile ? `${currentFile.path}/${currentFile.fileName}` : "请选择文件"}
                </Typography.Text>
                <Space size={4}>
                  {currentFile && <Tag>{fileTypeOf(currentFile)}</Tag>}
                  <Button
                    size="small"
                    icon={<DesktopOutlined />}
                    onClick={() => setWriteLocalOpen(true)}
                  >
                    写入本地
                  </Button>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    loading={downloading}
                    onClick={handleDownloadZip}
                  >
                    下载 ZIP
                  </Button>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    disabled={!currentFile}
                    onClick={handleCopyCode}
                  >
                    复制代码
                  </Button>
                </Space>
              </div>

              {currentFile ? (
                <CodeViewer
                  value={currentFile.content}
                  fileName={currentFile.fileName}
                  height="100%"
                />
              ) : (
                <div className="gen-drawer__code-empty">点击左侧文件预览代码</div>
              )}
            </div>
          </div>
        )}
      </Spin>

      <AiDiffModal
        open={aiDiff.diffOpen}
        diff={aiDiff.diff}
        onClose={() => aiDiff.setDiffOpen(false)}
        onLocate={locateField}
      />

      <WriteLocalDialog
        open={writeLocalOpen}
        files={files}
        frontendAppName={config.frontendAppName}
        backendAppName={config.backendAppName}
        onClose={() => setWriteLocalOpen(false)}
      />
    </Drawer>
  );
}

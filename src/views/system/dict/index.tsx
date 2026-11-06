import { useCallback, useEffect, useRef, useState } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Pagination,
  Radio,
  Spin,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import DictAPI from "@/api/system/dict";
import type { DictTypeForm, DictTypeItem, DictTypeQueryParams } from "@/api/system/dict";
import Auth from "@/components/Auth";
import PageAside from "@/components/PageAside";
import StatusDot from "@/components/StatusDot";
import { CommonStatus } from "@/enums";
import DictItemPanel from "./components/DictItemPanel";
import { validateForm } from "@/utils/form";

import "./index.scss";

/**
 * 字典管理
 */
export default function DictList() {
  const { t } = useTranslation();
  const { message, modal } = AntdApp.useApp();

  const [dictForm] = Form.useForm<DictTypeForm>();

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<DictTypeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [keywords, setKeywords] = useState("");
  const [queryParams, setQueryParams] = useState<DictTypeQueryParams>({
    pageNum: 1,
    pageSize: 20,
    keywords: "",
  });

  // 左侧字典类型折叠状态：折叠后右侧顶部仍会显示当前字典，用以免丢失上下文
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 当前选中的字典类型，右侧字典项据此联动
  const currentTypeRef = useRef<DictTypeItem | undefined>(undefined);
  const [currentType, setCurrentType] = useState<DictTypeItem | undefined>(undefined);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();

  // 切换右侧字典项归属的字典
  const applyCurrentType = useCallback((type?: DictTypeItem) => {
    currentTypeRef.current = type;
    setCurrentType(type);
  }, []);

  /**
   * 拉取字典类型并保持右侧选中项有效
   * @param preferDictCode 优先选中的字典编码，缺省沿用当前选中项
   */
  const fetchTypes = useCallback(
    async (preferDictCode?: string) => {
      setLoading(true);
      try {
        const data = await DictAPI.getPage(queryParams);
        const rows = data.list ?? [];
        setList(rows);
        setTotal(data.total ?? 0);

        const target = preferDictCode ?? currentTypeRef.current?.dictCode;
        applyCurrentType(rows.find((row) => row.dictCode === target) ?? rows[0]);
      } finally {
        setLoading(false);
      }
    },
    [applyCurrentType, queryParams],
  );

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  /**
   * 按关键字查询字典类型
   */
  function handleSearch(nextKeywords = keywords) {
    setQueryParams((prev) => ({ ...prev, keywords: nextKeywords, pageNum: 1 }));
  }

  function openCreateDialog() {
    setEditingId(undefined);
    dictForm.resetFields();
    dictForm.setFieldsValue({ status: CommonStatus.ENABLED });
    setDialogOpen(true);
  }

  async function openUpdateDialog(id: string) {
    const data = await DictAPI.getFormData(id);
    setEditingId(id);
    dictForm.resetFields();
    dictForm.setFieldsValue(data);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    const values = await validateForm(dictForm);
    if (!values) return;

    if (editingId) {
      await DictAPI.update(editingId, values);
    } else {
      await DictAPI.create(values);
    }

    message.success(t("common.saveSuccess"));
    setDialogOpen(false);
    fetchTypes(values.dictCode);
  }

  /**
   * 删除字典，右侧联动到剩余的字典类型
   */
  function handleDelete(id: string) {
    modal.confirm({
      title: t("common.tips"),
      content: t("system.dict.deleteTypeConfirm"),
      okButtonProps: { danger: true },
      onOk: async () => {
        await DictAPI.deleteByIds(id);
        message.success(t("common.deleteSuccess"));
        fetchTypes();
      },
    });
  }

  return (
    <div className="page-container page-container--split dict-page">
      <PageAside
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        expandText={t("system.dict.expandAside")}
        collapseText={t("system.dict.collapseAside")}
      >
        <div className="dict-type">
          <div className="dict-type__search">
            <Input
              value={keywords}
              placeholder={t("system.dict.keyword")}
              allowClear
              onChange={(event) => {
                setKeywords(event.target.value);
                // 清空即恢复全部，与手动搜索一致
                if (!event.target.value) handleSearch("");
              }}
              onPressEnter={() => handleSearch()}
            />
            <Auth perm="sys:dict:create">
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDialog} />
            </Auth>
          </div>

          <Spin spinning={loading} classNames={{ root: "dict-type__spin" }}>
            <div className="dict-type__list">
              {list.map((row) => (
                <div
                  key={row.id}
                  className={`dict-type__item${
                    row.dictCode === currentType?.dictCode ? " is-active" : ""
                  }`}
                  onClick={() => row.dictCode !== currentType?.dictCode && applyCurrentType(row)}
                >
                  <div className="dict-type__info">
                    <span className="dict-type__name" title={row.name}>
                      <StatusDot active={row.status === CommonStatus.ENABLED} />
                      {row.name}
                    </span>
                    <span className="dict-type__code" title={row.dictCode}>
                      {row.dictCode}
                    </span>
                  </div>
                  <div className="dict-type__actions">
                    <Auth perm="sys:dict:update">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(event) => {
                          event.stopPropagation();
                          openUpdateDialog(row.id);
                        }}
                      />
                    </Auth>
                    <Auth perm="sys:dict:delete">
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(row.id);
                        }}
                      />
                    </Auth>
                  </div>
                </div>
              ))}

              {!loading && list.length === 0 && (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("system.dict.empty")} />
              )}
            </div>
          </Spin>

          <div className="dict-type__footer">
            <span>{t("system.dict.count", { total })}</span>
            <Pagination
              size="small"
              current={queryParams.pageNum}
              pageSize={queryParams.pageSize}
              total={total}
              showSizeChanger={false}
              onChange={(pageNum) => setQueryParams((prev) => ({ ...prev, pageNum }))}
            />
          </div>
        </div>
      </PageAside>

      <div className="page-main">
        {currentType ? (
          <DictItemPanel
            key={currentType.dictCode}
            dictCode={currentType.dictCode}
            dictName={currentType.name}
          />
        ) : (
          <Card className="page-content dict-page__empty">
            <Empty description={t("system.dict.selectTip")} />
          </Card>
        )}
      </div>

      <Modal
        title={editingId ? t("system.dict.editTitle") : t("system.dict.createTitle")}
        open={dialogOpen}
        onOk={handleSubmit}
        onCancel={() => setDialogOpen(false)}
        destroyOnHidden
      >
        <Form form={dictForm} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} className="pt-4">
          <Form.Item
            name="name"
            label={t("system.dict.name")}
            rules={[{ required: true, message: t("system.dict.nameRequired") }]}
          >
            <Input placeholder={t("system.dict.namePlaceholder")} />
          </Form.Item>
          <Form.Item
            name="dictCode"
            label={t("system.dict.dictCode")}
            rules={[{ required: true, message: t("system.dict.dictCodeRequired") }]}
          >
            <Input placeholder={t("system.dict.dictCodePlaceholder")} />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}>
            <Radio.Group>
              <Radio value={CommonStatus.ENABLED}>{t("common.enabled")}</Radio>
              <Radio value={CommonStatus.DISABLED}>{t("common.disabled")}</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="remark" label={t("common.remark")}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

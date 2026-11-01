import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Col,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Tag,
} from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import DictAPI from "@/api/system/dict";
import type { DictItemForm, DictTagType } from "@/api/system/dict";
import { invalidateDict, onDictChange, useDict } from "@/hooks/useDict";
import { useRealtimeStore } from "@/stores/realtime";
import { toTagColor } from "@/utils/dict";
import { validateForm } from "@/utils/form";
import { RealtimeConnectionStatus } from "@/utils/realtime/client";

// 性别字典编码
const DICT_CODE = "gender";
// 男性字典项 ID
const MALE_ITEM_ID = "1";

// 可选的标记颜色
const TAG_TYPES: Array<Exclude<DictTagType, "">> = [
  "success",
  "warning",
  "danger",
  "info",
  "primary",
];

/**
 * 字典实时更新演示
 */
export default function DictSyncDemo() {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();

  const [dictForm] = Form.useForm<DictItemForm>();

  const [saving, setSaving] = useState(false);
  const realtimeStatus = useRealtimeStore((state) => state.status);
  const connected = realtimeStatus === RealtimeConnectionStatus.CONNECTED;
  const [lastUpdateTime, setLastUpdateTime] = useState("-");
  const [selectedGender, setSelectedGender] = useState<string | number>("1");

  // 缓存失效时 useDict 会自动重新拉取，中间的组件展示与右侧的缓存内容都跟着更新
  const cachedItems = useDict(DICT_CODE);

  // 加载男性字典项表单数据
  const loadMaleDict = useCallback(async () => {
    const data = await DictAPI.getDictItemFormData(DICT_CODE, MALE_ITEM_ID);
    dictForm.setFieldsValue({
      ...data,
      dictCode: DICT_CODE,
      // 前端的语义色名与后端存储格式一致，直接回显
      tagType: data.tagType || undefined,
    });
  }, [dictForm]);

  useEffect(() => {
    // 字典变更由全局实时连接推到 notifyDictChange，这里只记录最近一次更新时间
    const unsubscribeChange = onDictChange((dictChange) => {
      if (dictChange.dictCode !== DICT_CODE) return;
      setLastUpdateTime(dayjs().format("YYYY-MM-DD HH:mm:ss"));
    });

    loadMaleDict();

    return () => {
      unsubscribeChange();
    };
  }, [loadMaleDict]);

  async function handleSave() {
    const values = await validateForm(dictForm);
    if (!values) return;

    setSaving(true);
    try {
      await DictAPI.updateDictItem(DICT_CODE, MALE_ITEM_ID, { ...values, dictCode: DICT_CODE });
      setLastUpdateTime(dayjs().format("YYYY-MM-DD HH:mm:ss"));
      message.success(t("demo.dictSync.saveSuccess"));
    } finally {
      setSaving(false);
    }
  }

  /**
   * 重新拉取性别字典并刷新展示
   */
  function refreshDict() {
    invalidateDict(DICT_CODE);
  }

  return (
    <div className="page-container">
      <Card
        title={t("demo.dictSync.title")}
        extra={
          <Tag color={connected ? "success" : "error"} className="m-0">
            WebSocket {connected ? t("demo.dictSync.connected") : t("demo.dictSync.disconnected")}
          </Tag>
        }
      >
        <Alert className="mb-4" type="info" showIcon message={t("demo.dictSync.alert")} />

        <Row gutter={16}>
          <Col span={8}>
            <Card
              title={t("demo.dictSync.maleItem")}
              extra={
                <Button size="small" onClick={loadMaleDict}>
                  {t("demo.dictSync.reset")}
                </Button>
              }
            >
              <Form form={dictForm} labelCol={{ span: 6 }} wrapperCol={{ span: 17 }}>
                <Form.Item name="dictCode" label={t("system.dict.dictCode")}>
                  <Input disabled />
                </Form.Item>
                <Form.Item
                  name="label"
                  label={t("system.dict.itemLabel")}
                  rules={[{ required: true, message: t("system.dict.itemLabelRequired") }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item name="value" label={t("system.dict.itemValue")}>
                  <Input disabled />
                </Form.Item>
                <Form.Item name="tagType" label={t("system.dict.tagType")}>
                  <Select
                    allowClear
                    placeholder={t("system.dict.tagTypePlaceholder")}
                    options={TAG_TYPES.map((tagType) => ({
                      value: tagType,
                      label: <Tag color={toTagColor(tagType)}>{tagType}</Tag>,
                    }))}
                  />
                </Form.Item>
                <Form.Item label={null}>
                  <Button type="primary" loading={saving} onClick={handleSave}>
                    {t("common.save")}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col span={8}>
            <Card
              title={t("demo.dictSync.component")}
              extra={
                <Button type="primary" size="small" onClick={refreshDict}>
                  {t("demo.dictSync.refresh")}
                </Button>
              }
            >
              <h4>{t("demo.dictSync.genderGroup")}</h4>
              <Radio.Group
                value={selectedGender}
                onChange={(event) => setSelectedGender(event.target.value)}
                options={cachedItems.map((item) => ({ value: item.value, label: item.label }))}
              />

              <h4 className="mt-4">{t("demo.dictSync.genderTags")}</h4>
              <div>
                {cachedItems.map((item) => (
                  <Tag key={String(item.value)} color={toTagColor(item.tagType)} className="mr-2">
                    {item.label}
                  </Tag>
                ))}
              </div>

              <div className="mt-4 pt-3 border-top">
                <div className="text-secondary text-xs">
                  {t("demo.dictSync.selected")} {String(selectedGender)}
                </div>
                <div className="text-secondary text-xs">
                  {t("demo.dictSync.lastUpdate")} {lastUpdateTime}
                </div>
              </div>
            </Card>
          </Col>

          <Col span={8}>
            <Card
              title={t("demo.dictSync.cache")}
              extra={
                <Tag color={cachedItems.length > 0 ? "success" : "error"} className="m-0">
                  {cachedItems.length > 0 ? t("demo.dictSync.cached") : t("demo.dictSync.uncached")}
                </Tag>
              }
            >
              <pre className="dict-sync-monitor__cache">{JSON.stringify(cachedItems, null, 2)}</pre>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

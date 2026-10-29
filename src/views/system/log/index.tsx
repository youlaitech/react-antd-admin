import { useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  type TableProps,
} from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";

import LogAPI from "@/api/system/log";
import type { LogItem, LogQueryParams } from "@/api/system/log";
import RefreshButton from "@/components/RefreshButton";
import { LogStatus } from "@/enums";
import { useTableQuery } from "@/hooks/useTableQuery";

/**
 * 搜索表单的字段类型
 * 日期范围选择器给的是 dayjs 对象，提交前才格式化成接口需要的字符串
 */
interface LogSearchForm {
  keywords?: string;
  createTime?: [Dayjs, Dayjs];
}

/** HTTP 方法对应的标签色 */
const METHOD_TAG_COLOR: Record<string, string> = {
  GET: "default",
  POST: "success",
  PUT: "warning",
  DELETE: "error",
  PATCH: "processing",
};

/**
 * 系统日志
 */
export default function LogList() {
  const { t } = useTranslation();

  const [searchForm] = Form.useForm<LogSearchForm>();
  const [detail, setDetail] = useState<LogItem>();

  const { loading, list, total, queryParams, setQueryParams, fetchList } = useTableQuery<
    LogItem,
    LogQueryParams
  >({ fetcher: LogAPI.getPage });

  function handleSearch() {
    const { keywords, createTime } = searchForm.getFieldsValue();

    setQueryParams((prev) => ({
      ...prev,
      keywords,
      createTime: createTime
        ? [createTime[0].format("YYYY-MM-DD"), createTime[1].format("YYYY-MM-DD")]
        : undefined,
      pageNum: 1,
    }));
  }

  function handleReset() {
    searchForm.resetFields();
    setQueryParams((prev) => ({ ...prev, keywords: undefined, createTime: undefined, pageNum: 1 }));
  }

  const columns: TableProps<LogItem>["columns"] = [
    { title: t("system.log.title"), dataIndex: "title", minWidth: 180, ellipsis: true },
    {
      title: t("common.status"),
      dataIndex: "status",
      width: 90,
      align: "center",
      render: (status: number) =>
        status === LogStatus.SUCCESS ? (
          <Tag color="success">{t("system.log.success")}</Tag>
        ) : (
          <Tag color="error">{t("system.log.fail")}</Tag>
        ),
    },
    { title: t("system.log.ip"), dataIndex: "ip", width: 140 },
    { title: t("system.log.requestUri"), dataIndex: "requestUri", minWidth: 180, ellipsis: true },
    {
      title: t("system.log.requestMethod"),
      dataIndex: "requestMethod",
      width: 110,
      align: "center",
      render: (method: string) => <Tag color={METHOD_TAG_COLOR[method] ?? "default"}>{method}</Tag>,
    },
    {
      title: t("system.log.executionTime"),
      dataIndex: "executionTime",
      width: 120,
      align: "center",
    },
    { title: t("system.log.operatorName"), dataIndex: "operatorName", width: 120 },
    { title: t("system.log.createTime"), dataIndex: "createTime", width: 180 },
    {
      title: t("common.operate"),
      key: "operate",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => setDetail(record)}>
          {t("system.log.detail")}
        </Button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card className="page-search">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keywords">
            <Input placeholder={t("system.log.keyword")} allowClear className="w-200px" />
          </Form.Item>
          <Form.Item name="createTime">
            <DatePicker.RangePicker
              className="w-260px"
              format="YYYY-MM-DD"
              inputReadOnly
              allowClear
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                {t("common.search")}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                {t("common.reset")}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card className="page-content">
        <div className="page-toolbar">
          <RefreshButton onClick={fetchList} loading={loading} />
        </div>

        <Table<LogItem>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          scroll={{ x: 1300 }}
          pagination={{
            current: queryParams.pageNum,
            pageSize: queryParams.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (count) => t("common.total", { total: count }),
            onChange: (pageNum, pageSize) =>
              setQueryParams((prev) => ({ ...prev, pageNum, pageSize })),
          }}
        />
      </Card>

      <Modal
        title={t("system.log.detail")}
        open={!!detail}
        footer={null}
        width={720}
        onCancel={() => setDetail(undefined)}
      >
        <Descriptions column={2} bordered size="small" className="mt-4">
          <Descriptions.Item label={t("system.log.title")} span={2}>
            {detail?.title}
          </Descriptions.Item>
          <Descriptions.Item label={t("common.status")}>
            {detail?.status === LogStatus.SUCCESS ? t("system.log.success") : t("system.log.fail")}
          </Descriptions.Item>
          <Descriptions.Item label={t("system.log.executionTime")}>
            {detail?.executionTime} ms
          </Descriptions.Item>
          <Descriptions.Item label={t("system.log.operatorName")}>
            {detail?.operatorName}
          </Descriptions.Item>
          <Descriptions.Item label={t("system.log.createTime")}>
            {detail?.createTime}
          </Descriptions.Item>
          <Descriptions.Item label={t("system.log.ip")}>{detail?.ip}</Descriptions.Item>
          <Descriptions.Item label={t("system.log.requestMethod")}>
            {detail?.requestMethod}
          </Descriptions.Item>
          <Descriptions.Item label={t("system.log.requestUri")} span={2}>
            {detail?.requestUri}
          </Descriptions.Item>
          <Descriptions.Item label={t("system.log.browser")}>{detail?.browser}</Descriptions.Item>
          <Descriptions.Item label={t("system.log.os")}>{detail?.os}</Descriptions.Item>
          <Descriptions.Item label={t("system.log.content")} span={2}>
            <span className="whitespace-pre-wrap">{detail?.content || t("system.log.empty")}</span>
          </Descriptions.Item>
          {detail?.errorMsg && (
            <Descriptions.Item label={t("system.log.errorMsg")} span={2}>
              <span className="text-danger">{detail.errorMsg}</span>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Modal>
    </div>
  );
}

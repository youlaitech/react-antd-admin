import { useCallback, useMemo, useState } from "react";
import { App as AntdApp, Descriptions, Modal, Tag } from "antd";

import NoticeAPI from "@/api/system/notice";
import type { NoticeDetail, NoticeItem, NoticeQueryParams } from "@/api/system/notice";
import { CrudTable, useCrudPage } from "@/components/Crud";
import type { CrudSearchConfig, CrudTableConfig } from "@/components/Crud";
import DictTag from "@/components/DictTag";

/** 通知已读标记：1 已读、0 未读 */
const NOTICE_READ = 1;

/** 我的通知 */
export default function MyNotice() {
  const { message } = AntdApp.useApp();

  const [detail, setDetail] = useState<NoticeDetail>();
  const [detailOpen, setDetailOpen] = useState(false);

  /** 查看详情 */
  const openDetail = useCallback(async (id: string) => {
    setDetail(await NoticeAPI.getDetail(id));
    setDetailOpen(true);
  }, []);

  const searchConfig: CrudSearchConfig = useMemo(
    () => ({
      formItems: [{ type: "input", label: "通知标题", prop: "title", placeholder: "关键字" }],
    }),
    []
  );

  const tableConfig = useMemo<CrudTableConfig<NoticeItem, NoticeQueryParams>>(
    () => ({
      permPrefix: "system:notice",
      pk: "id",
      // 我的通知是只读视图：不提供新增与删除，只留刷新
      toolbar: [],
      defaultToolbar: ["refresh"],
      scrollX: 1200,
      cols: [
        { type: "index", label: "序号", width: 60, align: "center" },
        { label: "通知标题", prop: "title", width: 240 },
        {
          label: "通知类型",
          width: 140,
          align: "center",
          render: (row) => <DictTag code="notice_type" value={row.type} />,
        },
        {
          label: "通知等级",
          width: 120,
          align: "center",
          render: (row) => <DictTag code="notice_level" value={row.level} />,
        },
        { label: "发布时间", prop: "publishTime", width: 170, align: "center" },
        { label: "发布人", prop: "publisherName", width: 140, align: "center" },
        {
          label: "状态",
          width: 100,
          align: "center",
          render: (row) => (
            <Tag color={row.isRead === NOTICE_READ ? "success" : "default"}>
              {row.isRead === NOTICE_READ ? "已读" : "未读"}
            </Tag>
          ),
        },
        {
          label: "操作",
          width: 90,
          align: "center",
          fixed: "right",
          templet: "tool",
          operat: [{ name: "view", text: "查看" }],
        },
      ],
      indexAction: (params) => NoticeAPI.getMyNoticePage(params),
    }),
    []
  );

  const crud = useCrudPage<NoticeItem, NoticeQueryParams>({
    table: tableConfig,
    search: searchConfig,
    initialParams: {},
    onOperate: (name, row) => {
      if (name === "view") {
        openDetail(row.id).catch(() => message.error("通知详情加载失败"));
      }
    },
  });

  return (
    <div className="page-container">
      <CrudTable<NoticeItem, NoticeQueryParams> {...crud.tableProps} />

      <Modal
        title="通知详情"
        open={detailOpen}
        footer={null}
        width={720}
        onCancel={() => setDetailOpen(false)}
        destroyOnHidden
      >
        <Descriptions
          className="mt-4"
          column={2}
          bordered
          size="small"
          items={[
            { key: "title", label: "通知标题", children: detail?.title, span: 2 },
            {
              key: "type",
              label: "通知类型",
              children: <DictTag code="notice_type" value={detail?.type} />,
            },
            {
              key: "level",
              label: "通知等级",
              children: <DictTag code="notice_level" value={detail?.level} />,
            },
            { key: "publisher", label: "发布人", children: detail?.publisherName },
            { key: "time", label: "发布时间", children: detail?.publishTime },
            {
              key: "content",
              label: "通知内容",
              span: 2,
              children: (
                <div
                  className="rich-text"
                  dangerouslySetInnerHTML={{ __html: detail?.content ?? "" }}
                />
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
}

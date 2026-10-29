import { useCallback, useEffect, useRef, useState } from "react";
import {
  App as AntdApp,
  Badge,
  Button,
  Empty,
  Modal,
  Popover,
  Segmented,
  Space,
  Tooltip,
  Typography,
} from "antd";
import { BellOutlined, ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import NoticeAPI from "@/api/system/notice";
import type { NoticeDetail, NoticeItem } from "@/api/system/notice";
import DictTag from "@/components/DictTag";
import { useRealtimeStore } from "@/stores/realtime";
import { RealtimeConnectionStatus } from "@/utils/realtime/client";

/** 下拉面板每页展示条数 */
const PAGE_SIZE = 5;

/** 通知读取状态：0=未读，1=已读 */
type NoticeStatus = 0 | 1;

/** 我的通知列表页路径 */
const MY_NOTICE_PATH = "/profile/notice";

/**
 * 通知中心
 */
export default function NoticeCenter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message, notification } = AntdApp.useApp();

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<NoticeStatus>(0);
  const [list, setList] = useState<NoticeItem[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [detail, setDetail] = useState<NoticeDetail>();
  const [detailOpen, setDetailOpen] = useState(false);
  /** 详情弹窗当前展示的通知 ID，用于判断撤回是否需要关闭 */
  const detailIdRef = useRef<string | undefined>(undefined);

  /** 当前 Tab */
  const statusRef = useRef<NoticeStatus>(0);
  statusRef.current = status;

  // 拉取指定 Tab 的列表，未读 Tab 顺带更新角标
  const fetchList = useCallback(async (target: NoticeStatus) => {
    const page = await NoticeAPI.getMyNoticePage({
      pageNum: 1,
      pageSize: PAGE_SIZE,
      isRead: target,
    });
    setList(page.list ?? []);

    if (target === 0) setUnreadTotal(page.total ?? 0);
  }, []);

  // 只查未读总数，用于切到已读 Tab 后刷新角标
  const fetchUnreadTotal = useCallback(async () => {
    const page = await NoticeAPI.getMyNoticePage({ pageNum: 1, pageSize: 1, isRead: 0 });
    setUnreadTotal(page.total ?? 0);
  }, []);

  // 刷新：已读 Tab 额外刷新未读总数
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchList(statusRef.current),
      statusRef.current === 0 ? Promise.resolve() : fetchUnreadTotal(),
    ]);
  }, [fetchList, fetchUnreadTotal]);

  // 切换未读/已读，同 Tab 重复点击不请求
  const handleStatusChange = useCallback(
    (next: NoticeStatus) => {
      if (next === statusRef.current) return;
      setStatus(next);
      statusRef.current = next;
      void fetchList(next);
    },
    [fetchList]
  );

  // 查看详情：从下拉列表移除该条，未读则角标减一
  const read = useCallback(
    async (id: string) => {
      const item = list.find((notice) => notice.id === id);
      const wasUnread = item?.isRead !== 1;

      setDetail(await NoticeAPI.getDetail(id));
      detailIdRef.current = id;
      setDetailOpen(true);

      setList((prev) => prev.filter((notice) => notice.id !== id));
      if (wasUnread) setUnreadTotal((prev) => Math.max(prev - 1, 0));

      await refresh();
    },
    [list, refresh]
  );

  // 全部标记为已读
  const readAll = useCallback(async () => {
    if (unreadTotal <= 0) return;

    await NoticeAPI.readAll();
    setUnreadTotal(0);
    if (statusRef.current === 0) {
      setList([]);
    } else {
      await fetchList(1);
    }
    message.success(t("notice.readAllSuccess"));
  }, [fetchList, message, t, unreadTotal]);

  // 跳转到通知列表页
  const goMore = useCallback(() => {
    setOpen(false);
    navigate(MY_NOTICE_PATH);
  }, [navigate]);

  // 首次挂载先拉一轮，页面不打开也能显示角标
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // 每次连接建立后补拉，断线期间错过的公告不能只靠推送补回
  const realtimeStatus = useRealtimeStore((state) => state.status);
  useEffect(() => {
    if (realtimeStatus === RealtimeConnectionStatus.CONNECTED) void refresh();
  }, [realtimeStatus, refresh]);

  /**
   * 订阅公告变更：推送只带 ID 与动作，列表统一回源刷新。
   */
  useEffect(() => {
    return useRealtimeStore.getState().subscribeNotice((message) => {
      const { noticeId, action } = message.payload;

      if (action === "revoked") {
        // 正在查看的通知被撤回时关闭详情
        if (detailIdRef.current === noticeId) {
          detailIdRef.current = undefined;
          setDetail(undefined);
          setDetailOpen(false);
        }
      } else {
        notification.open({
          message: t("notice.newTitle"),
          description: t("notice.newDesc"),
          type: "success",
          placement: "bottomRight",
        });
      }

      void refresh();
    });
  }, [notification, refresh, t]);

  const emptyText = status === 0 ? t("notice.emptyUnread") : t("notice.emptyRead");

  return (
    <>
      <Popover
        trigger="click"
        placement="bottomRight"
        open={open}
        content={
          <div className="notice-center__panel">
            <Segmented
              block
              size="small"
              value={status}
              onChange={(value) => handleStatusChange(value as NoticeStatus)}
              options={[
                {
                  value: 0,
                  label: (
                    <span className="notice-center__tab">
                      {t("notice.unread")}
                      {unreadTotal > 0 && (
                        <span className="notice-center__count">
                          {unreadTotal > 99 ? "99+" : unreadTotal}
                        </span>
                      )}
                    </span>
                  ),
                },
                { value: 1, label: t("notice.read") },
              ]}
            />

            {list.length > 0 ? (
              <div className="notice-center__list">
                {list.map((item) => (
                  <div
                    key={item.id}
                    className={`notice-center__item${item.isRead === 1 ? " is-read" : ""}`}
                  >
                    <DictTag code="notice_type" value={item.type} />
                    <Typography.Text
                      className="notice-center__item-title"
                      ellipsis
                      onClick={() => {
                        void read(item.id);
                      }}
                    >
                      {item.title}
                    </Typography.Text>
                    <span className="notice-center__time">{item.publishTime}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="notice-center__empty">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
              </div>
            )}

            <div className="notice-center__footer">
              <Button type="link" size="small" onClick={goMore}>
                {t("notice.more")}
              </Button>
              {unreadTotal > 0 && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    void readAll();
                  }}
                >
                  {t("notice.readAll")}
                </Button>
              )}
            </div>
          </div>
        }
        onOpenChange={(next) => {
          setOpen(next);
          // 每次展开都重新取数，避免看到过期的列表
          if (next) void refresh();
        }}
      >
        <Tooltip title={t("notice.title")}>
          {/* 角标套在图标上而不是按钮外层：外层再包一层会让 Popover 拿不到触发元素的 ref */}
          <Button
            type="text"
            icon={
              <Badge dot={unreadTotal > 0}>
                <BellOutlined />
              </Badge>
            }
          />
        </Tooltip>
      </Popover>

      <Modal
        width={720}
        centered
        open={detailOpen}
        footer={null}
        onCancel={() => {
          detailIdRef.current = undefined;
          setDetailOpen(false);
        }}
        destroyOnHidden
        title={
          detail && (
            <Space size={8}>
              <DictTag code="notice_type" value={detail.type} />
              <span className="notice-center__detail-title">{detail.title}</span>
            </Space>
          )
        }
      >
        <div className="notice-center__detail-meta">
          <span className="notice-center__detail-meta-item">
            <UserOutlined />
            {detail?.publisherName}
          </span>
          <span className="notice-center__detail-meta-item">
            <ClockCircleOutlined />
            {detail?.publishTime}
          </span>
        </div>

        {detail?.content ? (
          <div className="rich-text" dangerouslySetInnerHTML={{ __html: detail.content }} />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("notice.contentEmpty")} />
        )}
      </Modal>
    </>
  );
}

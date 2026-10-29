import { create } from "zustand";

import RealtimeAPI from "@/api/realtime";
import { ROLE_ROOT } from "@/constants";
import { notifyDictChange, refreshCachedDicts } from "@/hooks/useDict";
import { getAuthSessionRevision } from "@/utils/auth";
import { createRealtimeClient, RealtimeConnectionStatus } from "@/utils/realtime/client";
import { parseRealtimeTicket } from "@/utils/realtime/protocol";
import type {
  NoticeChangedMessage,
  PresenceSnapshot,
  RealtimeServerMessage,
  RealtimeTopic,
} from "@/utils/realtime/protocol";

/**
 * 只依赖用户信息的角色与权限，避免与 user store 互相引用。
 */
export interface RealtimeUserInfo {
  readonly roles?: string[];
  readonly perms?: string[];
}

type NoticeHandler = (message: NoticeChangedMessage) => void;

/**
 * 实时连接与业务订阅状态。
 */
interface RealtimeState {
  /** 连接状态 */
  status: RealtimeConnectionStatus;
  /** 当前节点在线统计 */
  presence: PresenceSnapshot | null;
  /**
   * 登录态确立后启动连接，并随会话或权限变化重建
   */
  start: (getUserInfo: () => RealtimeUserInfo) => void;
  /**
   * 断开连接并清理会话状态
   */
  stop: () => void;
  /**
   * 订阅公告变更，返回取消订阅函数
   */
  subscribeNotice: (handler: NoticeHandler) => () => void;
}

/** 单例客户端与业务订阅 */
let client: ReturnType<typeof createRealtimeClient> | null = null;
let getUserInfo: (() => RealtimeUserInfo) | null = null;
let sessionKey = "";
let presenceRequest: Promise<void> | null = null;
const noticeHandlers = new Set<NoticeHandler>();
const seenNoticeIds = new Set<string>();

/**
 * 是否有权查看在线人数。
 */
function hasPresencePermission(info: RealtimeUserInfo): boolean {
  const roles = info.roles ?? [];
  const perms = info.perms ?? [];
  return roles.includes(ROLE_ROOT) || perms.some((p) => p === "sys:online:view" || p === "*:*:*");
}

/**
 * 按权限选择订阅主题。
 */
function getTopics(info: RealtimeUserInfo): readonly RealtimeTopic[] {
  return hasPresencePermission(info) ? ["notice", "dict", "presence"] : ["notice", "dict"];
}

/**
 * 会话标识，用于识别登录账号或权限变化。
 */
function getSessionKey(info: RealtimeUserInfo): string {
  return [
    getAuthSessionRevision(),
    [...(info.roles ?? [])].sort().join(),
    [...(info.perms ?? [])].sort().join(),
  ].join("|");
}

/**
 * 拉取在线人数快照，会话切换后丢弃旧响应。
 */
function calibratePresence(): void {
  const info = getUserInfo?.();
  if (!info || !hasPresencePermission(info) || presenceRequest) return;
  const revision = getAuthSessionRevision();
  presenceRequest = RealtimeAPI.getPresenceSnapshot()
    .then((snapshot) => {
      if (revision !== getAuthSessionRevision()) return;
      useRealtimeStore.setState({ presence: snapshot });
    })
    .catch(() => {
      // 无权限或服务未启用时保持空快照
    })
    .finally(() => {
      presenceRequest = null;
    });
}

/**
 * 分发服务端消息，业务侧只关心公告、字典与在线人数。
 */
function handleMessage(message: RealtimeServerMessage): void {
  switch (message.type) {
    case "connection.ready":
      // 重连后补拉，断线期间的通知与字典变更不能只靠推送补回
      calibratePresence();
      refreshCachedDicts();
      break;
    case "notice.changed": {
      // 只保留有限去重窗口，不将消息 ID 当作持久投递记录
      if (seenNoticeIds.has(message.id)) return;
      seenNoticeIds.add(message.id);
      if (seenNoticeIds.size > 128) {
        const first = seenNoticeIds.values().next().value;
        if (first) seenNoticeIds.delete(first);
      }
      noticeHandlers.forEach((handler) => {
        try {
          handler(message);
        } catch {
          console.error("[Realtime] 公告订阅执行失败");
        }
      });
      break;
    }
    case "dict.changed":
      notifyDictChange(message.payload.dictCode);
      break;
    case "presence.snapshot":
      useRealtimeStore.setState({ presence: message.payload });
      break;
  }
}

/**
 * 创建客户端并同步连接状态到 store。
 */
function ensureClient() {
  if (client) return client;
  client = createRealtimeClient({
    /**
     * 领取并校验票据；服务未启用或无权连接时返回 null。
     */
    async requestTicket(request) {
      const ticket = await RealtimeAPI.createTicket(request);
      if (ticket === null) return null;
      const result = parseRealtimeTicket(ticket);
      if (result.kind === "rejected") throw new Error("领票响应格式不正确");
      return result.value;
    },
  });
  client.onStatusChange((status) => useRealtimeStore.setState({ status }));
  client.onMessage(handleMessage);
  return client;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  status: RealtimeConnectionStatus.DISCONNECTED,
  presence: null,

  start: (getInfo) => {
    getUserInfo = getInfo;
    const info = getInfo();
    const key = getSessionKey(info);
    const realtimeClient = ensureClient();

    // 账号或权限变化后重建，避免沿用旧会话的主题与在线快照
    if (key !== sessionKey) {
      sessionKey = key;
      seenNoticeIds.clear();
      set({ presence: null });
      realtimeClient.disconnect();
    }
    realtimeClient.connect(getTopics(info));
  },

  stop: () => {
    sessionKey = "";
    getUserInfo = null;
    seenNoticeIds.clear();
    noticeHandlers.clear();
    presenceRequest = null;
    client?.disconnect();
    set({ status: RealtimeConnectionStatus.DISCONNECTED, presence: null });
  },

  subscribeNotice: (handler) => {
    noticeHandlers.add(handler);
    return () => {
      noticeHandlers.delete(handler);
    };
  },
}));

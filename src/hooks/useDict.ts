import { useEffect, useState } from "react";

import DictAPI from "@/api/system/dict";
import type { DictItemOption } from "@/api/system/dict";
import { SseTopics } from "@/enums";
import { getSseConnection } from "@/utils/sse";

/** 字典项缓存 */
const dictCache = new Map<string, DictItemOption[]>();

/** 进行中的请求 */
const pendingRequests = new Map<string, Promise<DictItemOption[]>>();

/**
 * 缓存失效后的通知者
 * 已挂载的消费方要跟着重新拉一次，否则会一直用旧数据
 */
const listeners = new Map<string, Set<() => void>>();

/** 取字典项 */
function fetchDictItems(dictCode: string): Promise<DictItemOption[]> {
  const cached = dictCache.get(dictCode);
  if (cached) return Promise.resolve(cached);

  const pending = pendingRequests.get(dictCode);
  if (pending) return pending;

  const request = DictAPI.getDictItems(dictCode)
    .then((items) => {
      dictCache.set(dictCode, items);
      return items;
    })
    .finally(() => pendingRequests.delete(dictCode));

  pendingRequests.set(dictCode, request);
  return request;
}

/** 清除某个字典的缓存并通知消费方重新拉取 */
export function invalidateDict(dictCode: string) {
  dictCache.delete(dictCode);
  // 正在进行的请求要作废，否则消费方会被合并到这次旧请求上，拿到失效前的结果
  pendingRequests.delete(dictCode);
  listeners.get(dictCode)?.forEach((notify) => notify());
}

/**
 * 清空全部字典缓存
 */
export function clearDictCache() {
  dictCache.clear();
  listeners.forEach((group) => group.forEach((notify) => notify()));
}

/**
 * 字典变更消息
 */
export interface DictChangeMessage {
  /** 字典编码 */
  dictCode: string;
}

/** 字典变更回调 */
type DictChangeCallback = (message: DictChangeMessage) => void;

const dictChangeCallbacks = new Set<DictChangeCallback>();
let unsubscribeDictChange: (() => void) | null = null;

/**
 * 订阅后端字典变更推送，收到即清掉对应缓存（幂等，重复调用不会重复订阅）
 */
export function setupDictSync() {
  unsubscribeDictChange ??= getSseConnection().on<DictChangeMessage>(SseTopics.DICT, (message) => {
    if (!message?.dictCode) {
      console.warn("[dict] 收到无效的字典变更消息：缺少 dictCode");
      return;
    }

    invalidateDict(message.dictCode);
    dictChangeCallbacks.forEach((callback) => callback(message));
  });
}

/**
 * 取消字典订阅并清空所有回调
 */
export function teardownDictSync() {
  unsubscribeDictChange?.();
  unsubscribeDictChange = null;
  dictChangeCallbacks.clear();
}

/**
 * 注册字典变更回调，返回取消注册函数
 */
export function onDictChange(callback: DictChangeCallback) {
  dictChangeCallbacks.add(callback);
  return () => dictChangeCallbacks.delete(callback);
}

/** 按字典编码取字典项 */
export function useDict(dictCode: string) {
  const [options, setOptions] = useState<DictItemOption[]>(() => dictCache.get(dictCode) ?? []);

  useEffect(() => {
    if (!dictCode) return;

    let cancelled = false;
    const cached = dictCache.get(dictCode);

    if (cached) {
      setOptions(cached);
    } else {
      fetchDictItems(dictCode)
        .then((items) => {
          if (cancelled) return;
          setOptions(items);
        })
        .catch((error) => {
          // 提示已由响应拦截器给出，这里只记录日志
          console.warn(error);
        });
    }

    /** 缓存失效后重新拉取 */
    const reload = () => {
      fetchDictItems(dictCode)
        .then((items) => {
          if (cancelled) return;
          setOptions(items);
        })
        .catch((error) => console.warn(error));
    };

    const group = listeners.get(dictCode) ?? new Set<() => void>();
    group.add(reload);
    listeners.set(dictCode, group);

    return () => {
      cancelled = true;
      group.delete(reload);
      if (group.size === 0) listeners.delete(dictCode);
    };
  }, [dictCode]);

  return options;
}

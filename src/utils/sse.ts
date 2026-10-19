import { AuthStorage } from "@/utils/auth";
import { useUserStore } from "@/stores/user";

/**
 * SSE 连接状态
 */
export enum SseConnectionState {
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
}

/**
 * SSE 连接配置
 */
export interface SseOptions {
  /** 连接地址，默认走代理前缀 */
  url?: string;
  /** 是否输出调试日志 */
  debug?: boolean;
  /** 连接超时(ms) */
  connectionTimeout?: number;
  /** 重连间隔基数(ms)，实际间隔按基数逐次翻倍 */
  reconnectInterval?: number;
  /** 重连间隔上限(ms) */
  maxReconnectInterval?: number;
  /** 最大重试次数，超过后停止重连 */
  maxReconnectAttempts?: number;
}

/** SSE 事件处理器 */
type EventHandler = (data: unknown) => void;

/** 连接状态变化的监听者 */
type StateListener = (state: SseConnectionState) => void;

/** SSE 流解析的中间状态 */
interface SseParseState {
  currentEvent: string;
  currentData: string;
  buffer: string;
}

let globalConnection: SseConnection | null = null;

/** SSE 连接 */
class SseConnection {
  private readonly config: Required<SseOptions>;

  private state = SseConnectionState.DISCONNECTED;

  private abortController: AbortController | null = null;

  private connectionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  /** 主动断开后不再重连 */
  private manualDisconnect = false;

  private reconnectAttempts = 0;

  private currentReconnectInterval: number;

  /** 本轮的拒绝是否已刷新过令牌，防止无限刷新 */
  private tokenRefreshed = false;

  private readonly eventHandlers = new Map<string, Set<EventHandler>>();

  private readonly stateListeners = new Set<StateListener>();

  constructor(options: SseOptions = {}) {
    this.config = {
      url: options.url ?? `${import.meta.env.VITE_APP_BASE_API}/api/v1/sse/connect`,
      debug: options.debug ?? false,
      connectionTimeout: options.connectionTimeout ?? 10000,
      reconnectInterval: options.reconnectInterval ?? 5000,
      maxReconnectInterval: options.maxReconnectInterval ?? 120000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
    };
    this.currentReconnectInterval = this.config.reconnectInterval;
  }

  /** 当前连接状态 */
  getState() {
    return this.state;
  }

  /** 订阅状态变化，返回取消订阅函数 */
  onStateChange(listener: StateListener) {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /**
   * 订阅事件，返回取消订阅函数
   */
  on<T = unknown>(eventName: string, handler: (data: T) => void) {
    const handlers = this.eventHandlers.get(eventName) ?? new Set<EventHandler>();
    const wrapped: EventHandler = (data) => handler(data as T);
    handlers.add(wrapped);
    this.eventHandlers.set(eventName, handlers);
    this.log(`已订阅事件: ${eventName}`);

    return () => {
      handlers.delete(wrapped);
      if (handlers.size === 0) this.eventHandlers.delete(eventName);
    };
  }

  /** 建立连接，已连接或连接中时直接返回 */
  connect() {
    this.manualDisconnect = false;

    if (this.state !== SseConnectionState.DISCONNECTED) {
      this.log(
        this.state === SseConnectionState.CONNECTED ? "SSE 已连接，跳过" : "SSE 连接中，跳过"
      );
      return;
    }

    const token = AuthStorage.getAccessToken();
    if (!token) {
      this.log("未检测到有效令牌，稍后重试");
      this.scheduleReconnect();
      return;
    }

    this.setState(SseConnectionState.CONNECTING);
    this.abortController = new AbortController();

    this.connectionTimeoutTimer = setTimeout(() => {
      if (this.state === SseConnectionState.CONNECTING) {
        this.log("SSE 连接超时");
        this.disconnect();
      }
    }, this.config.connectionTimeout);

    fetch(this.config.url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
      signal: this.abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            return this.handleUnauthorized(response.status);
          }
          throw new Error(`HTTP ${response.status}`);
        }

        this.clearConnectionTimeout();
        this.setState(SseConnectionState.CONNECTED);
        this.tokenRefreshed = false;
        this.resetReconnectState();
        this.log("SSE 连接已建立");
        return response.body?.getReader();
      })
      .then((streamReader) => {
        if (!streamReader) return;
        this.reader = streamReader;
        return this.consumeStream(streamReader);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") {
          this.log("SSE 连接已主动断开");
          return;
        }
        console.error("[SSE] 连接错误:", error);
        this.setState(SseConnectionState.DISCONNECTED);
        this.scheduleReconnect();
      });
  }

  /** 主动断开，不触发重连 */
  disconnect() {
    this.manualDisconnect = true;
    this.clearConnectionTimeout();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reader?.cancel();
    this.reader = null;
    this.abortController?.abort();
    this.abortController = null;
    this.setState(SseConnectionState.DISCONNECTED);
    this.log("SSE 连接已断开");
  }

  /** 断开连接并清空所有订阅 */
  cleanup() {
    this.disconnect();
    this.eventHandlers.clear();
    this.log("SSE 资源已清理");
  }

  /**
   * 令牌过期：刷新后重连，刷新失败或仍未拿到令牌则停止重连
   */
  private async handleUnauthorized(status: number) {
    this.clearConnectionTimeout();

    if (this.tokenRefreshed) {
      this.manualDisconnect = true;
      this.setState(SseConnectionState.DISCONNECTED);
      this.log(`SSE 连接被拒绝（HTTP ${status}），不再重连`);
      return null;
    }

    this.tokenRefreshed = true;
    const userStore = useUserStore.getState();
    try {
      await userStore.refreshTokenOnce();
      if (AuthStorage.getAccessToken()) {
        this.setState(SseConnectionState.DISCONNECTED);
        this.log(`SSE 连接被拒绝（HTTP ${status}），令牌已刷新，使用新令牌重连`);
        this.connect();
        return null;
      }
    } catch (error) {
      console.error("[SSE] 令牌刷新失败:", error);
      await userStore.redirectToLogin();
    }

    this.manualDisconnect = true;
    this.setState(SseConnectionState.DISCONNECTED);
    return null;
  }

  /**
   * 持续读取流数据并按行解析，异常时触发重连
   */
  private async consumeStream(streamReader: ReadableStreamDefaultReader<Uint8Array>) {
    const decoder = new TextDecoder();
    const parseState: SseParseState = { currentEvent: "message", currentData: "", buffer: "" };

    try {
      for (;;) {
        const { done, value } = await streamReader.read();
        if (done) {
          this.reader = null;
          this.setState(SseConnectionState.DISCONNECTED);
          this.log("SSE 连接已关闭");
          return;
        }

        parseState.buffer += decoder.decode(value, { stream: true });

        // 保留最后一段不完整的行，等下一块数据拼上再解析
        const lines = parseState.buffer.split("\n");
        parseState.buffer = lines.pop() ?? "";

        lines.forEach((line) => this.handleLine(line, parseState));
      }
    } catch (error) {
      this.reader = null;
      this.setState(SseConnectionState.DISCONNECTED);

      if (error instanceof Error && error.name === "AbortError") {
        this.log("SSE 流读取已主动断开");
        return;
      }

      console.error("[SSE] 流读取错误:", error);
      this.scheduleReconnect();
    }
  }

  /**
   * 解析单行 SSE 数据：区分注释、event、data 与空行（空行触发分发）
   */
  private handleLine(line: string, parseState: SseParseState) {
    if (line.startsWith(":")) return;

    if (line.startsWith("event:")) {
      parseState.currentEvent = line.slice(6).trim() || "message";
      return;
    }

    if (line.startsWith("data:")) {
      const dataLine = line.slice(5).trim();
      parseState.currentData = parseState.currentData
        ? `${parseState.currentData}\n${dataLine}`
        : dataLine;
      return;
    }

    if (line === "") {
      this.flushEvent(parseState.currentEvent, parseState.currentData);
      parseState.currentEvent = "message";
      parseState.currentData = "";
    }
  }

  /**
   * 分发事件：先尝试 JSON 解析，失败则传原始字符串
   */
  private flushEvent(eventName: string, data: string) {
    if (!data) return;

    this.eventHandlers.get(eventName)?.forEach((handler) => {
      try {
        handler(JSON.parse(data));
      } catch {
        handler(data);
      }
    });

    this.log(`收到事件[${eventName}]:`, data);
  }

  /** 指数退避重连，达到上限或主动断开时停止 */
  private scheduleReconnect() {
    if (this.manualDisconnect) return;

    if (
      this.config.maxReconnectAttempts > 0 &&
      this.reconnectAttempts >= this.config.maxReconnectAttempts
    ) {
      this.log(`已达到最大重试次数 ${this.config.maxReconnectAttempts}，停止重连`);
      return;
    }

    this.reconnectAttempts++;
    this.log(`将在 ${this.currentReconnectInterval}ms 后重试（${this.reconnectAttempts}）`);

    this.reconnectTimer = setTimeout(() => {
      this.currentReconnectInterval = Math.min(
        this.currentReconnectInterval * 2,
        this.config.maxReconnectInterval
      );
      this.connect();
    }, this.currentReconnectInterval);
  }

  /** 重连次数归零、间隔恢复基数 */
  private resetReconnectState() {
    this.reconnectAttempts = 0;
    this.currentReconnectInterval = this.config.reconnectInterval;
  }

  private clearConnectionTimeout() {
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
  }

  private setState(state: SseConnectionState) {
    this.state = state;
    this.stateListeners.forEach((listener) => listener(state));
  }

  private log(...args: unknown[]) {
    if (this.config.debug) console.debug("[SSE]", ...args);
  }
}

/** 取 SSE 连接实例 */
export function getSseConnection(options?: SseOptions) {
  globalConnection ??= new SseConnection(options);
  return globalConnection;
}

/**
 * 清理 SSE 连接：断开、清空订阅、释放全局引用
 */
export function cleanupSse() {
  globalConnection?.cleanup();
  globalConnection = null;
}

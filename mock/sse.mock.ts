import { createSSEStream } from "vite-plugin-mock-dev-server";
import { defineMock } from "./base";

/** SSE 事件名，取自 src/enums/sse.ts */
const TOPIC = {
  ONLINE_USERS: "online-users",
} as const;

/** SSE 长连接：只推 online-users 与心跳，dict/notice 事件需要时再手写推送 */
export default defineMock([
  {
    url: "sse/connect",
    method: ["GET"],
    response(req, res) {
      const sse = createSSEStream(req, res);
      const write = (event: string, data: string | object) => sse.write({ event, data });

      // 插件的 data 只接受 string | object，传数字会被丢弃，故用字符串；前端 JSON.parse 后仍是数字
      write(TOPIC.ONLINE_USERS, "12");

      // 之后每 10s 波动一次，演示实时刷新
      let tick = 0;
      const countTimer = setInterval(() => {
        tick += 1;
        write(TOPIC.ONLINE_USERS, String(12 + (tick % 5)));
      }, 10000);

      // 心跳：SSE 注释行，避免中间层因空闲主动断开
      const pingTimer = setInterval(() => sse.write({ comment: "ping" }), 15000);

      // 客户端断开时清理定时器，避免 dev server 长跑时累积
      const cleanup = () => {
        clearInterval(countTimer);
        clearInterval(pingTimer);
      };
      req.on("close", cleanup);
      req.on("aborted", cleanup);
      res.on("close", cleanup);
    },
  },
]);

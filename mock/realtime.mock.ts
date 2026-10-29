import { defineMock } from "./base";

/**
 * 实时连接 mock
 *
 * mock 环境没有 WebSocket 服务，领票统一返回 503 + REALTIME_DISABLED，
 * 前端据此静默降级，不会反复重连。
 */
export default defineMock([
  {
    url: "realtime/tickets",
    method: ["POST"],
    response(_req, res) {
      res.statusCode = 503;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ code: "B0102", msg: "实时服务未启用", data: null }));
    },
  },
  {
    url: "realtime/presence",
    method: ["GET"],
    body: {
      code: "00000",
      msg: "一切 ok",
      data: {
        onlineUsers: 12,
        onlineConnections: 15,
        nodeId: "mock-node",
        observedAt: new Date().toISOString(),
      },
    },
  },
]);

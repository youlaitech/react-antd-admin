import { defineMock } from "./base";

/** 应用 mock（内存态） */

interface AppRow {
  id: string;
  appName: string;
  appCode: string;
  platform: string;
  appId: string;
  appSecret: string;
  merchantId?: string;
  merchantKey?: string;
  status: number;
  remark?: string;
  createTime: string;
}

const appList: AppRow[] = [
  {
    id: "1",
    appName: "有来小程序",
    appCode: "YOULAI_MINI",
    platform: "WECHAT_MINI",
    appId: "wx1234567890abcdef",
    appSecret: "a1b2c3d4e5f6g7h8i9j0",
    merchantId: "1600000001",
    merchantKey: "youlai_merchant_key_001",
    status: 1,
    remark: "微信小程序端应用",
    createTime: "2026-01-12 10:24:00",
  },
  {
    id: "2",
    appName: "有来公众号",
    appCode: "YOULAI_MP",
    platform: "WECHAT_MP",
    appId: "wx0987654321fedcba",
    appSecret: "z9y8x7w6v5u4t3s2r1q0",
    status: 1,
    remark: "微信公众号端应用",
    createTime: "2026-01-20 15:08:00",
  },
  {
    id: "3",
    appName: "有来支付宝生活号",
    appCode: "YOULAI_ALIPAY",
    platform: "ALIPAY",
    appId: "2021003199998888",
    appSecret: "alipay_secret_placeholder",
    status: 0,
    remark: "暂未启用",
    createTime: "2026-03-05 09:41:00",
  },
];

/** 取当前时间 */
function now() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

export default defineMock([
  // 应用分页
  {
    url: "apps",
    method: ["GET"],
    body({ query }) {
      const { keywords, platform, status, pageNum = "1", pageSize = "10" } = query;
      const filtered = appList.filter((item) => {
        if (keywords && !`${item.appName}${item.appCode}${item.appId}`.includes(keywords)) {
          return false;
        }
        if (platform && item.platform !== platform) return false;
        if (status !== undefined && String(item.status) !== String(status)) return false;
        return true;
      });
      const page = Number(pageNum);
      const size = Number(pageSize);
      const start = (page - 1) * size;
      return {
        code: "00000",
        data: { list: filtered.slice(start, start + size), total: filtered.length },
        msg: "一切ok",
      };
    },
  },

  // 应用表单回显
  {
    url: "apps/:id/form",
    method: ["GET"],
    body({ params }) {
      return {
        code: "00000",
        data: appList.find((item) => item.id === String(params.id)) ?? null,
        msg: "一切ok",
      };
    },
  },

  // 新增应用
  {
    url: "apps",
    method: ["POST"],
    body({ body }) {
      appList.push({
        id: String(Date.now()),
        appName: String(body?.appName ?? ""),
        appCode: String(body?.appCode ?? ""),
        platform: String(body?.platform ?? "WECHAT_MINI"),
        appId: String(body?.appId ?? ""),
        appSecret: String(body?.appSecret ?? ""),
        merchantId: body?.merchantId,
        merchantKey: body?.merchantKey,
        status: Number(body?.status ?? 1),
        remark: body?.remark,
        createTime: now(),
      });
      return { code: "00000", data: null, msg: "新增成功" };
    },
  },

  // 修改应用
  {
    url: "apps/:id",
    method: ["PUT"],
    body({ params, body }) {
      const app = appList.find((item) => item.id === String(params.id));
      if (app) Object.assign(app, body);
      return { code: "00000", data: null, msg: "修改成功" };
    },
  },

  // 批量删除应用
  {
    url: "apps/:ids",
    method: ["DELETE"],
    body({ params }) {
      const ids = String(params.ids).split(",");
      ids.forEach((id) => {
        const index = appList.findIndex((item) => item.id === id);
        if (index !== -1) appList.splice(index, 1);
      });
      return { code: "00000", data: null, msg: "删除成功" };
    },
  },

  // 修改应用状态
  {
    url: "apps/:id/status",
    method: ["PUT"],
    body({ params, body }) {
      const app = appList.find((item) => item.id === String(params.id));
      if (app) app.status = Number(body?.status ?? app.status);
      return { code: "00000", data: null, msg: "修改状态成功" };
    },
  },
]);

import { defineMock } from "./base";
import { MENU_TABLE } from "./menu-table.data";

/** 租户套餐 mock（内存态）：套餐分页、下拉与菜单授权 */

/** 租户套餐行 */
interface PlanRow {
  id: number;
  name: string;
  code: string;
  status: number;
  sort: number;
  remark?: string;
  createTime: string;
  updateTime?: string;
}

/** 套餐数据（内存态） */
const plans: PlanRow[] = [
  {
    id: 1,
    name: "标准版",
    code: "STANDARD",
    status: 1,
    sort: 1,
    remark: "系统管理 + 代码生成",
    createTime: "2026-09-15 10:00:00",
    updateTime: "2026-09-15 10:00:00",
  },
  {
    id: 2,
    name: "旗舰版",
    code: "FLAGSHIP",
    status: 1,
    sort: 2,
    remark: "全部功能，含动态表单与工作流",
    createTime: "2026-09-15 10:05:00",
    updateTime: "2026-09-15 10:05:00",
  },
  {
    id: 3,
    name: "试用版",
    code: "TRIAL",
    status: 0,
    sort: 3,
    remark: "已停用，仅保留历史租户",
    createTime: "2026-09-15 10:10:00",
    updateTime: "2026-09-20 09:00:00",
  },
];

/** 套餐已授权菜单（内存态）：默认给全量菜单，改过就按改的存 */
const planMenuIds: Record<number, number[]> = {};

/** 展平菜单树取全部菜单 ID */
function allMenuIds(): number[] {
  const ids: number[] = [];
  const walk = (nodes: Array<{ id?: string; children?: unknown[] }>) => {
    nodes.forEach((node) => {
      if (node.id) ids.push(Number(node.id));
      const children = node.children as Array<{ id?: string; children?: unknown[] }> | undefined;
      if (children?.length) walk(children);
    });
  };
  walk(MENU_TABLE as Array<{ id?: string; children?: unknown[] }>);
  return ids;
}

/** 取当前时间 */
function now() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

/** 自增游标 */
let nextPlanId = 100;

export default defineMock([
  // 套餐下拉
  {
    url: "tenant-plans/options",
    method: ["GET"],
    body: () => ({
      code: "00000",
      data: plans
        .filter((item) => item.status === 1)
        .map((item) => ({ value: item.id, label: item.name })),
      msg: "一切ok",
    }),
  },

  // 套餐分页
  {
    url: "tenant-plans",
    method: ["GET"],
    body: ({ query }) => {
      const keywords = String(query?.keywords ?? "").trim();
      const status =
        query?.status === undefined || query?.status === "" ? undefined : Number(query.status);
      const pageNum = Math.max(1, Number(query?.pageNum) || 1);
      const pageSize = Math.max(1, Number(query?.pageSize) || 10);

      const list = plans.filter((item) => {
        if (keywords && !item.name.includes(keywords) && !item.code.includes(keywords))
          return false;
        if (status !== undefined && item.status !== status) return false;
        return true;
      });

      return {
        code: "00000",
        data: {
          list: list.slice((pageNum - 1) * pageSize, pageNum * pageSize),
          total: list.length,
        },
        msg: "一切ok",
      };
    },
  },

  // 套餐表单回显
  {
    url: "tenant-plans/:planId/form",
    method: ["GET"],
    body: ({ params }) => {
      const plan = plans.find((item) => String(item.id) === params.planId);
      return plan
        ? { code: "00000", data: { ...plan }, msg: "一切ok" }
        : { code: "A0404", data: null, msg: "套餐不存在" };
    },
  },

  // 套餐已授权菜单
  {
    url: "tenant-plans/:planId/menuIds",
    method: ["GET"],
    body: ({ params }) => {
      const planId = Number(params.planId);
      return { code: "00000", data: planMenuIds[planId] ?? allMenuIds(), msg: "一切ok" };
    },
  },

  // 保存套餐菜单授权
  {
    url: "tenant-plans/:planId/menus",
    method: ["PUT"],
    body: ({ params, body }) => {
      planMenuIds[Number(params.planId)] = (Array.isArray(body) ? body : []).map(Number);
      return { code: "00000", data: null, msg: "授权成功" };
    },
  },

  // 新增套餐
  {
    url: "tenant-plans",
    method: ["POST"],
    body: ({ body }) => {
      nextPlanId += 1;
      plans.push({
        id: nextPlanId,
        name: String(body?.name ?? "未命名套餐"),
        code: String(body?.code ?? `PLAN_${nextPlanId}`),
        status: Number(body?.status ?? 1),
        sort: Number(body?.sort ?? plans.length + 1),
        remark: body?.remark ?? "",
        createTime: now(),
      });
      return { code: "00000", data: null, msg: "新增套餐成功" };
    },
  },

  // 修改套餐
  {
    url: "tenant-plans/:planId",
    method: ["PUT"],
    body: ({ params, body }) => {
      const plan = plans.find((item) => String(item.id) === params.planId);
      if (!plan) return { code: "A0404", data: null, msg: "套餐不存在" };

      Object.assign(plan, {
        name: body?.name ?? plan.name,
        code: body?.code ?? plan.code,
        status: Number(body?.status ?? plan.status),
        sort: Number(body?.sort ?? plan.sort),
        remark: body?.remark ?? plan.remark,
        updateTime: now(),
      });
      return { code: "00000", data: null, msg: "修改套餐成功" };
    },
  },

  // 删除套餐（逗号分隔批量）
  {
    url: "tenant-plans/:ids",
    method: ["DELETE"],
    body: ({ params }) => {
      const ids = String(params.ids)
        .split(",")
        .map((id) => Number(id.trim()));
      for (let i = plans.length - 1; i >= 0; i -= 1) {
        if (ids.includes(plans[i].id)) plans.splice(i, 1);
      }
      return { code: "00000", data: null, msg: "删除成功" };
    },
  },
]);

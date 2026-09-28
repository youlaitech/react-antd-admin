import { defineMock } from "./base";
import { MENU_TABLE } from "./menu-table.data";

/** 租户 mock（内存态）：租户切换、平台租户管理与菜单授权 */

/** 租户行（对应 sys_tenant） */
interface TenantRow {
  id: number;
  name: string;
  code: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  domain?: string;
  logo?: string;
  planId?: number;
  status: number;
  remark?: string;
  expireTime?: string;
  createTime: string;
  updateTime?: string;
  /** 初始化管理员账号（新增时回显一次） */
  adminUsername?: string;
}

/** 租户数据（内存态） */
const tenants: TenantRow[] = [
  {
    id: 1,
    name: "有来科技",
    code: "YOULAI",
    contactName: "张三",
    contactPhone: "18812345678",
    contactEmail: "zhangsan@youlai.tech",
    domain: "youlai.youlai.tech",
    planId: 2,
    status: 1,
    remark: "平台自有租户",
    expireTime: "2027-09-15 23:59:59",
    createTime: "2026-09-15 10:00:00",
    updateTime: "2026-09-15 10:00:00",
    adminUsername: "admin",
  },
  {
    id: 2,
    name: "测试租户",
    code: "TEST",
    contactName: "李四",
    contactPhone: "18887654321",
    contactEmail: "lisi@test.com",
    domain: "test.youlai.tech",
    planId: 1,
    status: 1,
    remark: "联调用",
    expireTime: "2026-12-31 23:59:59",
    createTime: "2026-09-18 15:30:00",
    updateTime: "2026-09-18 15:30:00",
    adminUsername: "test_admin",
  },
  {
    id: 3,
    name: "历史租户",
    code: "LEGACY",
    contactName: "王五",
    contactPhone: "18800001111",
    domain: "legacy.youlai.tech",
    planId: 3,
    status: 0,
    remark: "已停用",
    createTime: "2026-09-10 09:00:00",
    updateTime: "2026-09-25 18:00:00",
  },
];

/** 当前租户 ID（切换器改的就是它） */
let currentTenantId = 1;

/** 租户已授权菜单（内存态）：默认给全量菜单，改过就按改的存 */
const tenantMenuIds: Record<number, number[]> = {};

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
let nextTenantId = 100;

/** 租户转精简信息（切换器用） */
function toTenantInfo(row: TenantRow) {
  return { id: row.id, name: row.name, domain: row.domain };
}

export default defineMock([
  // 可访问租户列表：正常状态的租户才能被切换到
  {
    url: "tenants/options",
    method: ["GET"],
    body: () => ({
      code: "00000",
      data: tenants.filter((item) => item.status === 1).map(toTenantInfo),
      msg: "一切ok",
    }),
  },

  // 当前租户
  {
    url: "tenants/current",
    method: ["GET"],
    body: () => {
      const tenant = tenants.find((item) => item.id === currentTenantId) ?? tenants[0];
      return { code: "00000", data: toTenantInfo(tenant), msg: "一切ok" };
    },
  },

  // 切换租户（返回切换后的租户信息）
  {
    url: "tenants/:tenantId/switch",
    method: ["POST"],
    body: ({ params }) => {
      const tenant = tenants.find((item) => String(item.id) === params.tenantId);
      if (!tenant) return { code: "A0404", data: null, msg: "租户不存在" };
      if (tenant.status !== 1) return { code: "A0400", data: null, msg: "租户已停用" };

      currentTenantId = tenant.id;
      return { code: "00000", data: toTenantInfo(tenant), msg: "切换成功" };
    },
  },

  // 租户分页
  {
    url: "tenants",
    method: ["GET"],
    body: ({ query }) => {
      const keywords = String(query?.keywords ?? "").trim();
      const status =
        query?.status === undefined || query?.status === "" ? undefined : Number(query.status);
      const pageNum = Math.max(1, Number(query?.pageNum) || 1);
      const pageSize = Math.max(1, Number(query?.pageSize) || 10);

      const list = tenants.filter((item) => {
        if (
          keywords &&
          !item.name.includes(keywords) &&
          !item.code.includes(keywords) &&
          !String(item.domain ?? "").includes(keywords)
        ) {
          return false;
        }
        if (status !== undefined && item.status !== status) return false;
        return true;
      });

      return {
        code: "00000",
        data: {
          list: list
            .slice((pageNum - 1) * pageSize, pageNum * pageSize)
            .map(({ adminUsername: _adminUsername, ...rest }) => rest),
          total: list.length,
        },
        msg: "一切ok",
      };
    },
  },

  // 租户表单回显
  {
    url: "tenants/:tenantId/form",
    method: ["GET"],
    body: ({ params }) => {
      const tenant = tenants.find((item) => String(item.id) === params.tenantId);
      return tenant
        ? { code: "00000", data: { ...tenant }, msg: "一切ok" }
        : { code: "A0404", data: null, msg: "租户不存在" };
    },
  },

  // 租户已授权菜单
  {
    url: "tenants/:tenantId/menuIds",
    method: ["GET"],
    body: ({ params }) => {
      const tenantId = Number(params.tenantId);
      return { code: "00000", data: tenantMenuIds[tenantId] ?? allMenuIds(), msg: "一切ok" };
    },
  },

  // 保存租户菜单授权
  {
    url: "tenants/:tenantId/menus",
    method: ["PUT"],
    body: ({ params, body }) => {
      tenantMenuIds[Number(params.tenantId)] = (Array.isArray(body) ? body : []).map(Number);
      return { code: "00000", data: null, msg: "授权成功" };
    },
  },

  // 修改租户状态（status 走 query）
  {
    url: "tenants/:tenantId/status",
    method: ["PUT"],
    body: ({ params, query }) => {
      const tenant = tenants.find((item) => String(item.id) === params.tenantId);
      if (!tenant) return { code: "A0404", data: null, msg: "租户不存在" };

      tenant.status = Number(query?.status ?? tenant.status);
      tenant.updateTime = now();
      return { code: "00000", data: null, msg: "修改状态成功" };
    },
  },

  // 新增租户：返回初始化管理员的账号与初始密码
  {
    url: "tenants",
    method: ["POST"],
    body: ({ body }) => {
      nextTenantId += 1;
      const code = String(body?.code ?? `TENANT_${nextTenantId}`);
      const adminUsername = String(body?.adminUsername ?? `${code.toLowerCase()}_admin`);

      tenants.push({
        id: nextTenantId,
        name: String(body?.name ?? "未命名租户"),
        code,
        contactName: body?.contactName ?? "",
        contactPhone: body?.contactPhone ?? "",
        contactEmail: body?.contactEmail ?? "",
        domain: body?.domain ?? "",
        logo: body?.logo ?? "",
        planId: body?.planId ? Number(body.planId) : undefined,
        status: 1,
        remark: body?.remark ?? "",
        expireTime: body?.expireTime ?? "",
        createTime: now(),
        updateTime: now(),
        adminUsername,
      });

      return {
        code: "00000",
        data: {
          tenantId: String(nextTenantId),
          tenantCode: code,
          tenantName: String(body?.name ?? "未命名租户"),
          adminUsername,
          adminInitialPassword: "123456",
          adminRoleCode: "TENANT_ADMIN",
        },
        msg: "新增租户成功",
      };
    },
  },

  // 修改租户
  {
    url: "tenants/:tenantId",
    method: ["PUT"],
    body: ({ params, body }) => {
      const tenant = tenants.find((item) => String(item.id) === params.tenantId);
      if (!tenant) return { code: "A0404", data: null, msg: "租户不存在" };

      Object.assign(tenant, {
        name: body?.name ?? tenant.name,
        contactName: body?.contactName ?? tenant.contactName,
        contactPhone: body?.contactPhone ?? tenant.contactPhone,
        contactEmail: body?.contactEmail ?? tenant.contactEmail,
        domain: body?.domain ?? tenant.domain,
        logo: body?.logo ?? tenant.logo,
        planId: body?.planId ? Number(body.planId) : tenant.planId,
        status: Number(body?.status ?? tenant.status),
        remark: body?.remark ?? tenant.remark,
        expireTime: body?.expireTime ?? tenant.expireTime,
        updateTime: now(),
      });
      return { code: "00000", data: null, msg: "修改租户成功" };
    },
  },

  // 删除租户（逗号分隔批量）
  {
    url: "tenants/:ids",
    method: ["DELETE"],
    body: ({ params }) => {
      const ids = String(params.ids)
        .split(",")
        .map((id) => Number(id.trim()));
      for (let i = tenants.length - 1; i >= 0; i -= 1) {
        if (ids.includes(tenants[i].id)) tenants.splice(i, 1);
      }
      return { code: "00000", data: null, msg: "删除成功" };
    },
  },
]);

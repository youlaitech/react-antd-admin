import ExcelJS from "exceljs";

import { defineMock } from "./base";
import { MENU_TABLE } from "./menu-table.data";

/** 用户 mock（内存态）：数据取自 sql/youlai_admin.sql 的 sys_user */

interface UserRow {
  /** 用户 id */
  id: string;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname: string;
  /** 手机号 */
  mobile: string;
  /** 性别：1 男 2 女 0 未知 */
  gender: number;
  /** 头像地址 */
  avatar: string;
  /** 邮箱 */
  email: string;
  /** 状态：1 启用 0 禁用 */
  status: number;
  /** 所属部门名称 */
  deptName: string | null;
  /** 角色名称，多个用逗号分隔 */
  roleNames: string | null;
  /** 创建时间 */
  createTime: string;
}

// 列表数据
const userList: UserRow[] = [
  {
    id: "1",
    username: "root",
    nickname: "有来技术",
    mobile: "18812345677",
    gender: 0,
    avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
    email: "youlaitech@163.com",
    status: 1,
    deptName: null,
    roleNames: "超级管理员",
    createTime: "2026-09-26 08:10",
  },
  {
    id: "2",
    username: "admin",
    nickname: "系统管理员",
    mobile: "18888888888",
    gender: 1,
    avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
    email: "youlaitech@163.com",
    status: 1,
    deptName: "有来技术",
    roleNames: "系统管理员",
    createTime: "2026-09-26 08:10",
  },
  {
    id: "3",
    username: "test",
    nickname: "测试小用户",
    mobile: "18812345679",
    gender: 1,
    avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
    email: "youlaitech@163.com",
    status: 1,
    deptName: "测试部门",
    roleNames: "自定义权限用户",
    createTime: "2026-09-26 08:10",
  },
  {
    id: "4",
    username: "dept_manager",
    nickname: "部门主管",
    mobile: "18812345680",
    gender: 1,
    avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
    email: "manager@youlaitech.com",
    status: 1,
    deptName: "有来技术",
    roleNames: "部门主管",
    createTime: "2026-09-26 08:10",
  },
  {
    id: "5",
    username: "dept_member",
    nickname: "部门成员",
    mobile: "18812345681",
    gender: 1,
    avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
    email: "member@youlaitech.com",
    status: 1,
    deptName: "有来技术",
    roleNames: "部门成员",
    createTime: "2026-09-26 08:10",
  },
  {
    id: "6",
    username: "employee",
    nickname: "普通员工",
    mobile: "18812345682",
    gender: 1,
    avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
    email: "employee@youlaitech.com",
    status: 1,
    deptName: "研发部门",
    roleNames: "普通员工",
    createTime: "2026-09-26 08:10",
  },
  {
    id: "7",
    username: "custom_user",
    nickname: "自定义权限用户",
    mobile: "18812345683",
    gender: 1,
    avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
    email: "custom@youlaitech.com",
    status: 1,
    deptName: "测试部门",
    roleNames: "自定义权限用户",
    createTime: "2026-09-26 08:10",
  },
];

// 表单数据（含 deptId / roleIds）
const userMap: Record<string, UserRow & { deptId: string; roleIds: string[] }> = {
  "1": {
    id: "1",
    username: "root",
    nickname: "有来技术",
    mobile: "18812345677",
    gender: 0,
    avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
    email: "youlaitech@163.com",
    status: 1,
    deptName: null,
    roleNames: "超级管理员",
    createTime: "2026-09-26 08:10",
    deptId: "",
    roleIds: ["1"],
  },
  "2": {
    id: "2",
    username: "admin",
    nickname: "系统管理员",
    mobile: "18888888888",
    gender: 1,
    avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
    email: "youlaitech@163.com",
    status: 1,
    deptName: "有来技术",
    roleNames: "系统管理员",
    createTime: "2026-09-26 08:10",
    deptId: "1",
    roleIds: ["2"],
  },
  "3": {
    id: "3",
    username: "test",
    nickname: "测试小用户",
    mobile: "18812345679",
    gender: 1,
    avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
    email: "youlaitech@163.com",
    status: 1,
    deptName: "测试部门",
    roleNames: "自定义权限用户",
    createTime: "2026-09-26 08:10",
    deptId: "3",
    roleIds: ["7"],
  },
  "4": {
    id: "4",
    username: "dept_manager",
    nickname: "部门主管",
    mobile: "18812345680",
    gender: 1,
    avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
    email: "manager@youlaitech.com",
    status: 1,
    deptName: "有来技术",
    roleNames: "部门主管",
    createTime: "2026-09-26 08:10",
    deptId: "1",
    roleIds: ["4"],
  },
  "5": {
    id: "5",
    username: "dept_member",
    nickname: "部门成员",
    mobile: "18812345681",
    gender: 1,
    avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
    email: "member@youlaitech.com",
    status: 1,
    deptName: "有来技术",
    roleNames: "部门成员",
    createTime: "2026-09-26 08:10",
    deptId: "1",
    roleIds: ["5"],
  },
  "6": {
    id: "6",
    username: "employee",
    nickname: "普通员工",
    mobile: "18812345682",
    gender: 1,
    avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
    email: "employee@youlaitech.com",
    status: 1,
    deptName: "研发部门",
    roleNames: "普通员工",
    createTime: "2026-09-26 08:10",
    deptId: "2",
    roleIds: ["6"],
  },
  "7": {
    id: "7",
    username: "custom_user",
    nickname: "自定义权限用户",
    mobile: "18812345683",
    gender: 1,
    avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
    email: "custom@youlaitech.com",
    status: 1,
    deptName: "测试部门",
    roleNames: "自定义权限用户",
    createTime: "2026-09-26 08:10",
    deptId: "3",
    roleIds: ["7"],
  },
};

let nextUserId = 100;

// 部门/角色映射
const DEPT_ID_NAME: Record<string, string> = {
  "1": "有来技术",
  "2": "研发部门",
  "3": "测试部门",
};

const ROLE_ID_NAME: Record<string, string> = {
  "1": "超级管理员",
  "2": "系统管理员",
  "3": "访问游客",
  "4": "部门主管",
  "5": "部门成员",
  "6": "普通员工",
  "7": "自定义权限用户",
};

// 导出文件与导入模板共用的列
const USER_COLUMNS = [
  { header: "昵称", key: "nickname", width: 16 },
  { header: "用户名", key: "username", width: 16 },
  { header: "部门", key: "deptName", width: 16 },
  { header: "角色", key: "roleNames", width: 20 },
  { header: "手机号", key: "mobile", width: 16 },
  { header: "邮箱", key: "email", width: 24 },
  { header: "状态", key: "status", width: 10 },
  { header: "创建时间", key: "createTime", width: 20 },
];

/**
 * 按查询条件筛选用户，列表与导出共用
 */
function filterUsers(query: Record<string, unknown> = {}): UserRow[] {
  const keywords = String(query.keywords ?? "").trim();
  const status =
    query.status === undefined || query.status === "" ? undefined : Number(query.status);
  const deptId = String(query.deptId ?? "").trim();
  // 表头角色筛选传的是逗号分隔的角色 ID，命中其中一个即算匹配
  const roleIds = String(query.roleIds ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const deptName = deptId ? DEPT_ID_NAME[deptId] : "";
  const createTime = query.createTime;
  const [start, end] = (
    Array.isArray(createTime) ? createTime : String(createTime ?? "").split(",")
  ).map((value) => String(value ?? "").slice(0, 10));

  return userList.filter((item) => {
    if (
      keywords &&
      !item.username.includes(keywords) &&
      !item.nickname.includes(keywords) &&
      !item.mobile.includes(keywords)
    )
      return false;
    if (status !== undefined && item.status !== status) return false;
    if (deptName && item.deptName !== deptName) return false;
    if (roleIds.length > 0) {
      const ownedRoleIds = userMap[item.id]?.roleIds ?? [];
      if (!ownedRoleIds.some((id) => roleIds.includes(id))) return false;
    }
    const createdDate = item.createTime.slice(0, 10);
    if (start && createdDate < start) return false;
    if (end && createdDate > end) return false;
    return true;
  });
}

/**
 * 生成用户列表工作簿，空行表示只带表头的导入模板
 */
async function buildUserWorkbook(rows: UserRow[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("用户列表");
  worksheet.columns = USER_COLUMNS;
  worksheet.addRows(
    rows.map((item) => ({
      nickname: item.nickname,
      username: item.username,
      deptName: item.deptName ?? "",
      roleNames: item.roleNames ?? "",
      mobile: item.mobile,
      email: item.email,
      status: item.status === 1 ? "正常" : "禁用",
      createTime: item.createTime,
    })),
  );
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/**
 * 菜单权限节点
 */
interface PermNode {
  /** 子菜单 */
  children?: PermNode[];
  /** 权限标识 */
  perm?: string | null;
}

/**
 * 收集菜单树里所有按钮的权限标识
 */
function collectPerms(nodes: PermNode[]): string[] {
  return nodes.flatMap((node) => [
    ...(node.perm ? [node.perm] : []),
    ...collectPerms(node.children ?? []),
  ]);
}

// 当前登录用户的权限标识，取自菜单表的按钮节点
const ALL_PERMS = collectPerms(MENU_TABLE as unknown as PermNode[]);

export default defineMock([
  // 当前登录用户信息（admin）
  {
    url: "users/me",
    method: ["GET"],
    body: {
      code: "00000",
      data: {
        userId: "2",
        username: "admin",
        nickname: "系统管理员",
        avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
        roles: ["ADMIN"],
        perms: ALL_PERMS,
      },
      msg: "一切ok",
    },
  },

  // 用户分页列表
  {
    url: "users",
    method: ["GET"],
    body({ query }) {
      const pageNum = Math.max(1, Number(query?.pageNum) || 1);
      const pageSize = Math.max(1, Number(query?.pageSize) || 10);
      const list = filterUsers(query);
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

  // 用户下拉
  {
    url: "users/options",
    method: ["GET"],
    body() {
      return {
        code: "00000",
        data: userList.map((i) => ({ value: i.id, label: i.nickname })),
        msg: "一切ok",
      };
    },
  },

  // 用户表单
  {
    url: "users/:userId/form",
    method: ["GET"],
    body({ params }) {
      const item = userMap[String(params.userId)];
      return { code: "00000", data: item ?? null, msg: "一切ok" };
    },
  },

  // 新增用户
  {
    url: "users",
    method: ["POST"],
    body({ body }) {
      const id = String(nextUserId++);
      const roleNames = (body.roleIds ?? [])
        .map((rid: string) => ROLE_ID_NAME[String(rid)])
        .filter(Boolean)
        .join(",");
      const item: UserRow = {
        id,
        username: body.username ?? "",
        nickname: body.nickname ?? "",
        mobile: body.mobile ?? "",
        gender: Number(body.gender ?? 1),
        avatar:
          body.avatar || "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
        email: body.email ?? "",
        status: Number(body.status ?? 1),
        deptName: DEPT_ID_NAME[String(body.deptId ?? "")] ?? null,
        roleNames: roleNames || null,
        createTime: "2026-09-26 08:10",
      };
      userList.unshift(item);
      userMap[id] = {
        ...item,
        deptId: String(body.deptId ?? ""),
        roleIds: (body.roleIds ?? []).map(String),
      };
      return { code: "00000", data: null, msg: "新增用户" + item.nickname + "成功" };
    },
  },

  // 修改用户
  {
    url: "users/:id",
    method: ["PUT"],
    body({ params, body }) {
      const item = userList.find((u) => u.id === String(params.id));
      if (item) {
        Object.assign(item, {
          nickname: body.nickname ?? item.nickname,
          mobile: body.mobile ?? item.mobile,
          gender: Number(body.gender ?? item.gender),
          email: body.email ?? item.email,
          status: Number(body.status ?? item.status),
          deptName: body.deptId
            ? (DEPT_ID_NAME[String(body.deptId)] ?? item.deptName)
            : item.deptName,
          roleNames: body.roleIds
            ? body.roleIds
                .map((r: string) => ROLE_ID_NAME[String(r)])
                .filter(Boolean)
                .join(",") || null
            : item.roleNames,
        });
        userMap[item.id] = {
          ...userMap[item.id],
          ...item,
          deptId: String(body.deptId ?? userMap[item.id]?.deptId ?? ""),
          roleIds: (body.roleIds ?? userMap[item.id]?.roleIds ?? []).map(String),
        };
      }
      return { code: "00000", data: null, msg: "修改用户" + (body.nickname ?? params.id) + "成功" };
    },
  },

  // 删除用户（逗号分隔批量）
  {
    url: "users/:ids",
    method: ["DELETE"],
    body({ params }) {
      const ids = String(params.ids)
        .split(",")
        .map((s) => s.trim());
      for (let i = userList.length - 1; i >= 0; i -= 1) {
        if (ids.includes(userList[i].id)) userList.splice(i, 1);
      }
      ids.forEach((id) => delete userMap[id]);
      return { code: "00000", data: null, msg: "删除用户" + params.ids + "成功" };
    },
  },

  // 重置密码（password 走请求体）
  {
    url: "users/:id/password/reset",
    method: ["PUT"],
    body({ params, body }) {
      return {
        code: "00000",
        data: null,
        msg: "重置用户" + params.id + "密码成功" + (body?.password ? "" : ""),
      };
    },
  },

  // 下载导入模板
  {
    url: "users/template",
    method: ["GET"],
    type: "buffer",
    headers: {
      "Content-Disposition":
        "attachment; filename=%E7%94%A8%E6%88%B7%E5%AF%BC%E5%85%A5%E6%A8%A1%E6%9D%BF.xlsx",
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    body: () => buildUserWorkbook([]),
  },

  // 导出用户
  {
    url: "users/export",
    method: ["GET"],
    type: "buffer",
    headers: {
      "Content-Disposition": "attachment; filename=%E7%94%A8%E6%88%B7%E5%88%97%E8%A1%A8.xlsx",
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    body({ query }) {
      return buildUserWorkbook(filterUsers(query));
    },
  },

  // 导入用户
  {
    url: "users/import",
    method: ["POST"],
    body: {
      code: "00000",
      data: { code: "00000", invalidCount: 0, validCount: 2, messageList: [] },
      msg: "一切ok",
    },
  },

  // 个人中心信息
  {
    url: "users/profile",
    method: ["GET"],
    body: {
      code: "00000",
      data: {
        id: "2",
        username: "admin",
        nickname: "系统管理员",
        avatar: "https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif",
        gender: 1,
        mobile: "18888888888",
        email: "youlaitech@163.com",
        deptName: "有来技术",
        roleNames: "系统管理员",
        createTime: "2026-09-26 08:10",
      },
      msg: "一切ok",
    },
  },

  // 修改个人中心信息
  {
    url: "users/profile",
    method: ["PUT"],
    body() {
      return { code: "00000", data: null, msg: "修改个人信息成功" };
    },
  },

  // 修改密码
  {
    url: "users/password",
    method: ["PUT"],
    body() {
      return { code: "00000", data: null, msg: "修改密码成功" };
    },
  },

  // 发送手机验证码
  {
    url: "users/mobile/code",
    method: ["POST"],
    body({ query }) {
      return { code: "00000", data: null, msg: "验证码已发送至 " + (query?.mobile ?? "") };
    },
  },

  // 绑定/更换手机号
  {
    url: "users/mobile",
    method: ["PUT"],
    body() {
      return { code: "00000", data: null, msg: "手机号绑定成功" };
    },
  },

  // 解绑手机号（密码走 body）
  {
    url: "users/mobile",
    method: ["DELETE"],
    body() {
      return { code: "00000", data: null, msg: "手机号解绑成功" };
    },
  },

  // 发送邮箱验证码
  {
    url: "users/email/code",
    method: ["POST"],
    body({ query }) {
      return { code: "00000", data: null, msg: "验证码已发送至 " + (query?.email ?? "") };
    },
  },

  // 绑定/更换邮箱
  {
    url: "users/email",
    method: ["PUT"],
    body() {
      return { code: "00000", data: null, msg: "邮箱绑定成功" };
    },
  },

  // 解绑邮箱（密码走 query）
  {
    url: "users/email",
    method: ["DELETE"],
    body() {
      return { code: "00000", data: null, msg: "邮箱解绑成功" };
    },
  },
]);

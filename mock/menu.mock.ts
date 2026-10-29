import { defineMock } from "./base";
import { MENU_ROUTES } from "./menu-routes.data";
import { MENU_TABLE } from "./menu-table.data";

/** 菜单 mock（内存态）：数据取自线上接口的生成物，写操作只改内存 */

/** 菜单行（对应 sys_menu 字段） */
interface MenuRow {
  id: string;
  parentId: string;
  name: string;
  /** C=目录 M=菜单 E=外链 B=按钮 */
  type: string;
  routeName?: string | null;
  routePath?: string;
  component?: string | null;
  perm?: string | null;
  externalUrl?: string | null;
  icon?: string;
  visible?: number;
  sort?: number;
  keepAlive?: number;
  redirect?: string | null;
  children?: MenuRow[];
}

/** 下拉选项 */
interface MenuOption {
  value: string;
  label: string;
  children?: MenuOption[];
}

/** 深拷贝，避免内存增删改动到生成物 */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const menuList: MenuRow[] = clone(MENU_TABLE) as unknown as MenuRow[];

/**
 * 遍历菜单树，对每个节点执行 visit
 */
function walk(nodes: MenuRow[], visit: (node: MenuRow) => void): void {
  nodes.forEach((node) => {
    visit(node);
    if (node.children?.length) walk(node.children, visit);
  });
}

/**
 * 按关键字过滤菜单树，命中的节点保留其祖先
 */
function filterTree(nodes: MenuRow[], keyword: string): MenuRow[] {
  if (!keyword) return nodes;

  const result: MenuRow[] = [];
  nodes.forEach((node) => {
    const children = node.children?.length ? filterTree(node.children, keyword) : [];
    if (node.name.includes(keyword) || children.length > 0) {
      result.push({ ...node, children: children.length > 0 ? children : undefined });
    }
  });
  return result;
}

/**
 * 把菜单树转成下拉选项，types 为空时不过滤
 */
function toOptions(nodes: MenuRow[], types: string[]): MenuOption[] {
  return nodes
    .filter((node) => types.length === 0 || types.includes(node.type))
    .map((node) => {
      const children = node.children?.length ? toOptions(node.children, types) : [];
      return children.length > 0
        ? { value: node.id, label: node.name, children }
        : { value: node.id, label: node.name };
    });
}

/**
 * 在树里找到指定节点
 */
function findNode(nodes: MenuRow[], id: string): MenuRow | undefined {
  let found: MenuRow | undefined;
  walk(nodes, (node) => {
    if (node.id === id) found = node;
  });
  return found;
}

/**
 * 从树里摘掉指定节点并返回它
 */
function detachNode(nodes: MenuRow[], id: string): MenuRow | undefined {
  const index = nodes.findIndex((node) => node.id === id);
  if (index >= 0) return nodes.splice(index, 1)[0];

  for (const node of nodes) {
    if (node.children?.length) {
      const removed = detachNode(node.children, id);
      if (removed) return removed;
    }
  }
  return undefined;
}

/**
 * 把节点挂到父节点下，父节点不存在时挂到根
 */
function attachNode(node: MenuRow, parentId: string): void {
  const parent = parentId === "0" ? undefined : findNode(menuList, parentId);
  const siblings = parent?.children ?? menuList;
  siblings.push(node);

  if (parent && !parent.children) parent.children = [node];
}

export default defineMock([
  // 动态路由（补充菜单的路由形态）
  {
    url: "menus/routes",
    method: ["GET"],
    body: () => ({
      code: "00000",
      data: clone(MENU_ROUTES),
      msg: "一切ok",
    }),
  },

  // 菜单表格树
  {
    url: "menus",
    method: ["GET"],
    body: ({ query }) => {
      const keyword = String(query?.keywords ?? "").trim();
      return {
        code: "00000",
        data: filterTree(menuList, keyword),
        msg: "一切ok",
      };
    },
  },

  // 上级菜单下拉：types 为重复参数（types=C&types=M），单值时也要兼容
  {
    url: "menus/options",
    method: ["GET"],
    body: ({ query }) => {
      const raw = query?.types;
      const types = raw === undefined ? [] : (Array.isArray(raw) ? raw : [raw]).map(String);
      return { code: "00000", data: toOptions(menuList, types), msg: "一切ok" };
    },
  },

  // 菜单表单
  {
    url: "menus/:id/form",
    method: ["GET"],
    body: ({ params }) => {
      const node = findNode(menuList, String(params.id));
      return {
        code: "00000",
        data: node ? { ...node, children: undefined } : null,
        msg: "一切ok",
      };
    },
  },

  // 新增菜单
  {
    url: "menus",
    method: ["POST"],
    body: ({ body }) => {
      const node: MenuRow = {
        id: String(Date.now()),
        parentId: String(body?.parentId ?? "0"),
        name: String(body?.name ?? ""),
        type: String(body?.type ?? "M"),
        routeName: body?.routeName ?? null,
        routePath: body?.routePath ?? "",
        component: body?.component ?? null,
        perm: body?.perm ?? null,
        externalUrl: body?.externalUrl ?? null,
        icon: body?.icon ?? "",
        visible: Number(body?.visible ?? 1),
        sort: Number(body?.sort ?? 1),
        keepAlive: Number(body?.keepAlive ?? 0),
        redirect: body?.redirect ?? null,
      };
      attachNode(node, node.parentId);
      return { code: "00000", data: null, msg: "新增菜单成功" };
    },
  },

  // 修改菜单
  {
    url: "menus/:id",
    method: ["PUT"],
    body: ({ params, body }) => {
      const node = findNode(menuList, String(params.id));
      if (!node) return { code: "A0001", data: null, msg: "菜单不存在" };

      // 父级变了要换位置，先摘出来再挂到新父级下
      const parentId = String(body?.parentId ?? node.parentId);
      if (parentId !== node.parentId) {
        detachNode(menuList, node.id);
        node.parentId = parentId;
        attachNode(node, parentId);
      }

      Object.assign(node, {
        name: body?.name ?? node.name,
        type: body?.type ?? node.type,
        routeName: body?.routeName ?? node.routeName,
        routePath: body?.routePath ?? node.routePath,
        component: body?.component ?? node.component,
        perm: body?.perm ?? node.perm,
        externalUrl: body?.externalUrl ?? node.externalUrl,
        icon: body?.icon ?? node.icon,
        visible: Number(body?.visible ?? node.visible),
        sort: Number(body?.sort ?? node.sort),
        keepAlive: Number(body?.keepAlive ?? node.keepAlive),
        redirect: body?.redirect ?? node.redirect,
      });
      return { code: "00000", data: null, msg: "修改菜单成功" };
    },
  },

  // 删除菜单，子菜单一并摘掉
  {
    url: "menus/:id",
    method: ["DELETE"],
    body: ({ params }) => {
      detachNode(menuList, String(params.id));
      return { code: "00000", data: null, msg: "删除菜单成功" };
    },
  },
]);

// 视图组件注册表：菜单 component 与页面文件的映射，菜单表单的页面路径选项树由此派生

/**
 * 全部视图模块，键形如 /src/views/system/user/index.tsx
 */
export const viewModules = import.meta.glob("/src/views/**/*.tsx");

const VIEW_PREFIX = "/src/views/";

/**
 * 视图文件路径集合，元素形如 system/user/index
 */
export const viewPaths = new Set(
  Object.keys(viewModules).map((key) => key.slice(VIEW_PREFIX.length).replace(/\.tsx$/, ""))
);

/**
 * 规整组件路径：去首尾空白、开头斜杠与 .tsx 后缀
 */
export function normalizeViewPath(componentPath: string): string {
  return componentPath
    .trim()
    .replace(/^\/+/, "")
    .replace(/\.tsx$/i, "");
}

/**
 * 判断组件路径是否存在对应视图文件，目录写法命中其 index.tsx
 */
export function isViewComponent(componentPath?: string): boolean {
  if (!componentPath) return false;
  const path = normalizeViewPath(componentPath);
  return viewPaths.has(path) || viewPaths.has(`${path}/index`);
}

/**
 * 选项树节点
 */
export interface PageComponentNode {
  /** 表单取值：真实文件路径，目录无 index.tsx 时不可选 */
  value?: string;
  label: string;
  children?: PageComponentNode[];
  disabled?: boolean;
}

/**
 * 判断路径是否可以作为页面组件选择项
 */
function isSelectable(path: string): boolean {
  const segments = path.split("/");
  if (segments.includes("components")) return false;
  return segments[0] !== "error" && path !== "redirect";
}

/**
 * 将视图路径插入选项树，index.tsx 归并到所在目录
 */
function insertPath(tree: PageComponentNode[], path: string): void {
  const segments = path.split("/");
  if (segments[segments.length - 1] === "index") segments.pop();

  let level = tree;
  segments.forEach((segment, index) => {
    const isLeaf = index === segments.length - 1;
    let node = level.find((item) => item.label === segment);

    if (!node) {
      node = { label: segment };
      level.push(node);
    }

    if (isLeaf) {
      // 取值始终是真实文件路径，与历史数据和列表展示一致
      node.value = path;
      return;
    }

    node.children ??= [];
    level = node.children;
  });
}

/**
 * 目录下没有 index.tsx 时不可选，只用于展开
 */
function markDisabled(nodes: PageComponentNode[]): void {
  nodes.forEach((node) => {
    if (!node.value) node.disabled = true;
    if (node.children) markDisabled(node.children);
  });
}

/**
 * 按名称排序树节点
 */
function sortTree(nodes: PageComponentNode[]): void {
  nodes.sort((a, b) => a.label.localeCompare(b.label));
  nodes.forEach((node) => node.children && sortTree(node.children));
}

/**
 * 把页面路径列表构造成组件树
 */
function buildTree(): PageComponentNode[] {
  const tree: PageComponentNode[] = [];

  [...viewPaths].filter(isSelectable).forEach((path) => insertPath(tree, path));

  sortTree(tree);
  markDisabled(tree);
  return tree;
}

/**
 * 页面组件选项树
 */
export const pageComponentTree = buildTree();

/**
 * 节点筛选：名称与文件路径都参与匹配，输入 index 可筛出所有主页
 */
export function filterPageComponent(
  query: string,
  node: { label?: string; value?: string }
): boolean {
  if (!query) return true;
  const keyword = query.toLowerCase();
  return (
    (node.label ?? "").toLowerCase().includes(keyword) ||
    (node.value ?? "").toLowerCase().includes(keyword)
  );
}

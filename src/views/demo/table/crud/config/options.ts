import { useSyncExternalStore } from "react";
import type { TreeSelectProps } from "antd";

import DeptAPI from "@/api/system/dept";
import RoleAPI from "@/api/system/role";
import type { OptionItem } from "@/api/common";

/** 部门与角色下拉放在模块级 */
let deptOptions: OptionItem[] = [];
let roleOptions: OptionItem[] = [];
let snapshot = { deptOptions, roleOptions };

const listeners = new Set<() => void>();

/** 通知订阅者数据已更新 */
function emit() {
  snapshot = { deptOptions, roleOptions };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

/** 订阅下拉数据，拉取完成后自动重渲染 */
export function useOptions() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** 并行拉取部门与角色下拉 */
export async function initOptions() {
  const [dept, roles] = await Promise.all([DeptAPI.getOptions(), RoleAPI.getOptions()]);
  deptOptions = dept;
  roleOptions = roles;
  emit();
}

/** 把下拉选项转成 antd 的树结构 */
export function toTreeData(options: OptionItem[]): TreeSelectProps["treeData"] {
  return options.map((item) => {
    const children = (item as { children?: OptionItem[] }).children;
    return {
      value: item.value,
      label: item.label,
      children: children ? toTreeData(children) : undefined,
    };
  });
}

/** 通用的状态选项 */
export function getStateOptions() {
  return [
    { label: "启用", value: 1 },
    { label: "禁用", value: 0 },
  ];
}

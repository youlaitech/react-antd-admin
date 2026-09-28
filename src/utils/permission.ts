import { ROLE_ROOT } from "@/constants";
import { useUserStore } from "@/stores/user";

/**
 * 权限判断
 * @param value 需要的权限标识，多个为「或」关系
 */
export function hasPerm(value: string | string[]): boolean {
  const { roles, perms } = useUserStore.getState().userInfo;

  if (!roles || !perms) {
    return false;
  }

  const requiredPerms = Array.isArray(value) ? value : [value];

  // 超级管理员或通配权限直接放行
  if (roles.includes(ROLE_ROOT) || requiredPerms.includes("*:*:*")) {
    return true;
  }

  return requiredPerms.some((perm) => perms.includes(perm));
}

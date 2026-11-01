import { ALL_PERMISSION, ROLE_ROOT } from "@/constants";
import { useUserStore } from "@/stores/user";

/**
 * 判断角色和权限集合是否满足要求，多个权限为「或」关系
 */
export function matchesPermission(
  value: string | string[],
  roles: readonly string[] = [],
  perms: readonly string[] = [],
): boolean {
  if (roles.includes(ROLE_ROOT) || perms.includes(ALL_PERMISSION)) {
    return true;
  }

  const requiredPerms = Array.isArray(value) ? value : [value];
  return requiredPerms.some((perm) => perms.includes(perm));
}

/**
 * 按当前用户判断权限
 * @param value 需要的权限标识，多个为「或」关系
 */
export function hasPerm(value: string | string[]): boolean {
  const { roles, perms } = useUserStore.getState().userInfo;
  return matchesPermission(value, roles, perms);
}

import { useCallback, useMemo } from "react";

import { ROLE_ROOT } from "@/constants";
import { useUserStore } from "@/stores/user";
import { matchesPermission } from "@/utils/permission";

/**
 * 权限相关的组合式函数
 */
export function useAuth() {
  const userInfo = useUserStore((state) => state.userInfo);

  // userInfo.roles 可能为空，兜底数组要 memo，否则每次渲染都是新引用会击穿 useCallback
  const roles = useMemo(() => userInfo.roles ?? [], [userInfo.roles]);
  const perms = useMemo(() => userInfo.perms ?? [], [userInfo.perms]);

  // 判断是否拥有指定角色，多个为「或」关系
  const hasRole = useCallback(
    (value: string | string[]) => {
      const requiredRoles = Array.isArray(value) ? value : [value];
      return roles.includes(ROLE_ROOT) || requiredRoles.some((role) => roles.includes(role));
    },
    [roles],
  );

  // 判断是否拥有指定权限，多个为「或」关系
  const hasPermission = useCallback(
    (value: string | string[]) => matchesPermission(value, roles, perms),
    [perms, roles],
  );

  return { userInfo, roles, perms, hasRole, hasPermission };
}

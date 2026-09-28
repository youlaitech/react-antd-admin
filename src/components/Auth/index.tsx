import type { ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";

interface AuthProps {
  /** 需要的权限标识，多个为「或」关系 */
  perm?: string | string[];
  /** 需要的角色标识，多个为「或」关系 */
  role?: string | string[];
  /** 无权限时的兜底内容 */
  fallback?: ReactNode;
  children: ReactNode;
}

/** 按权限标识或角色控制内容是否渲染 */
export default function Auth({ perm, role, fallback = null, children }: AuthProps) {
  const { hasPermission, hasRole } = useAuth();

  const passed = (!perm || hasPermission(perm)) && (!role || hasRole(role));

  return <>{passed ? children : fallback}</>;
}

import { PLATFORM_TENANT_ID } from "@/constants";
import { appConfig } from "@/settings";

/**
 * 是否启用多租户
 */
export const isTenantEnabled = () => appConfig.tenantEnabled;

/** 判断是否平台租户 */
export const isPlatformTenantId = (tenantId?: string | number) =>
  Number(tenantId) === PLATFORM_TENANT_ID;

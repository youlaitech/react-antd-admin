import { create } from "zustand";

import AuthAPI from "@/api/auth";
import TenantAPI from "@/api/system/tenant";
import type { TenantInfo } from "@/api/system/tenant";
import { STORAGE_KEYS } from "@/constants";
import { AuthStorage } from "@/utils/auth";

interface TenantState {
  /** 当前租户 ID */
  currentTenantId: number | null;
  /** 当前租户信息 */
  currentTenant: TenantInfo | null;
  /** 用户可访问的租户列表 */
  tenantList: TenantInfo[];
  /** 拉取租户列表并确定当前租户 */
  loadTenant: () => Promise<void>;
  /** 获取用户可访问的租户列表 */
  fetchTenantList: () => Promise<TenantInfo[]>;
  /** 设置租户列表 */
  setTenantList: (list: TenantInfo[]) => void;
  /** 设置当前租户并落盘 */
  setCurrentTenant: (tenant: TenantInfo) => void;
  /** 切换租户 */
  switchTenant: (tenantId: number) => Promise<void>;
  /** 清除租户信息 */
  clearTenant: () => void;
}

/**
 * 从 localStorage 恢复上次使用的租户
 */
function restoreTenant(): Pick<TenantState, "currentTenantId" | "currentTenant"> {
  const savedTenantId = localStorage.getItem(STORAGE_KEYS.TENANT_ID);
  const savedTenantInfo = localStorage.getItem(STORAGE_KEYS.TENANT_INFO);

  let currentTenant: TenantInfo | null = null;
  if (savedTenantInfo) {
    try {
      currentTenant = JSON.parse(savedTenantInfo) as TenantInfo;
    } catch (error) {
      console.error("解析租户信息失败", error);
    }
  }

  return {
    currentTenantId: savedTenantId ? Number(savedTenantId) : null,
    currentTenant,
  };
}

/** 清除本地保存的租户信息 */
function clearLocalTenant() {
  localStorage.removeItem(STORAGE_KEYS.TENANT_ID);
  localStorage.removeItem(STORAGE_KEYS.TENANT_INFO);
}

/**
 * 获取当前租户，失败返回 null
 */
async function safeGetCurrentTenant(): Promise<TenantInfo | null> {
  try {
    return await TenantAPI.getCurrentTenant();
  } catch (error) {
    console.debug("[Tenant] 获取当前租户失败，尝试本地/默认选择:", error);
    return null;
  }
}

/** 切换租户后重新签发令牌 */
async function refreshTokenIfSupported(tenantId: number) {
  try {
    const token = await AuthAPI.switchTenant(tenantId);
    if (token?.accessToken && token?.refreshToken) {
      AuthStorage.setTokens(token.accessToken, token.refreshToken, AuthStorage.getRememberMe());
    }
  } catch {
    // 静默忽略，切换流程继续
  }
}

export const useTenantStore = create<TenantState>((set, get) => ({
  ...restoreTenant(),
  tenantList: [],

  fetchTenantList: async () => {
    const data = await TenantAPI.getTenantList();
    const list = data ?? [];
    set({ tenantList: list });
    return list;
  },

  loadTenant: async () => {
    const restored = restoreTenant();
    set(restored);

    // 1. 获取租户列表
    const list = await get().fetchTenantList();

    // 2. 校验本地恢复的租户是否仍然可用，避免出现没有任何选中项
    if (
      restored.currentTenantId != null &&
      list.length > 0 &&
      !list.some((item) => item.id === restored.currentTenantId)
    ) {
      console.debug("[Tenant] 本地租户已不可用，清除并重新选择:", restored.currentTenantId);
      clearLocalTenant();
      set({ currentTenantId: null, currentTenant: null });
    }

    if (list.length === 0) return;

    const { currentTenantId, currentTenant } = get();

    // 3. 优先后端当前租户
    if (currentTenantId == null) {
      const currentTenantInfo = await safeGetCurrentTenant();
      if (currentTenantInfo) {
        get().setCurrentTenant(currentTenantInfo);
        return;
      }
    }

    // 4. 本地有 ID 但信息缺失时，从列表补全，保证展示名称一致
    if (currentTenantId != null && !currentTenant) {
      const matched = list.find((item) => item.id === currentTenantId);
      if (matched) {
        get().setCurrentTenant(matched);
        return;
      }
    }

    // 5. 兜底：默认选中第一个，保证切换器有默认值
    if (get().currentTenantId == null) {
      get().setCurrentTenant(list[0]);
      console.debug("[Tenant] 默认选中第一个租户:", list[0].name);
    }
  },

  setTenantList: (list) => set({ tenantList: list ?? [] }),

  setCurrentTenant: (tenant) => {
    localStorage.setItem(STORAGE_KEYS.TENANT_ID, String(tenant.id));
    localStorage.setItem(STORAGE_KEYS.TENANT_INFO, JSON.stringify(tenant));
    set({ currentTenantId: tenant.id, currentTenant: tenant });
  },

  switchTenant: async (tenantId) => {
    await refreshTokenIfSupported(tenantId);

    const tenantInfo = await TenantAPI.switchTenant(tenantId);
    if (tenantInfo) {
      get().setCurrentTenant(tenantInfo);
      return;
    }

    const matched = get().tenantList.find((item) => item.id === tenantId);
    if (matched) {
      get().setCurrentTenant(matched);
      return;
    }

    const fallback = await safeGetCurrentTenant();
    if (fallback) {
      get().setCurrentTenant(fallback);
      return;
    }

    throw new Error("切换租户后无法获取租户信息");
  },

  clearTenant: () => {
    clearLocalTenant();
    set({ currentTenantId: null, currentTenant: null, tenantList: [] });
  },
}));

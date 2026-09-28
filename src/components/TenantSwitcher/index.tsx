import { DownOutlined } from "@ant-design/icons";
import { Dropdown, type MenuProps } from "antd";
import { useTranslation } from "react-i18next";

import { useTenantStore } from "@/stores/tenant";

interface TenantSwitcherProps {
  /** 切换租户后的回调 */
  onChange: (tenantId: number) => void;
}

/** 租户切换器 */
export default function TenantSwitcher({ onChange }: TenantSwitcherProps) {
  const { t } = useTranslation();

  const tenantList = useTenantStore((state) => state.tenantList);
  const currentTenantId = useTenantStore((state) => state.currentTenantId);
  const currentTenant = useTenantStore((state) => state.currentTenant);

  if (tenantList.length === 0) return null;

  const currentName =
    tenantList.find((item) => item.id === currentTenantId)?.name ??
    currentTenant?.name ??
    t("navbar.switchTenant");

  const menuItems: MenuProps["items"] = tenantList.map((item) => ({
    key: String(item.id),
    label: item.name,
    className: item.id === currentTenantId ? "is-active" : undefined,
  }));

  function handleClick({ key }: { key: string }) {
    const tenantId = Number(key);
    if (tenantId === currentTenantId) return;
    onChange(tenantId);
  }

  return (
    <Dropdown
      trigger={["click"]}
      rootClassName="tenant-switcher__dropdown"
      menu={{ items: menuItems, onClick: handleClick }}
    >
      <div className="tenant-switcher__trigger" title={currentName}>
        <span className="tenant-switcher__label">{currentName}</span>
        <DownOutlined className="tenant-switcher__icon" />
      </div>
    </Dropdown>
  );
}

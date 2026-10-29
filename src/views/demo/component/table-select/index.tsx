import { useMemo, useState } from "react";
import { Alert } from "antd";
import { useTranslation } from "react-i18next";

import type { UserItem } from "@/api/system/user";
import TableSelect from "@/components/TableSelect";
import { useDict } from "@/hooks/useDict";
import { buildUserSelectConfig } from "./config/select";

/**
 * 列表选择器示例
 */
export default function TableSelectDemo() {
  const { t } = useTranslation();

  const [selectedUser, setSelectedUser] = useState<UserItem>();
  const genderOptions = useDict("gender");

  const selectConfig = useMemo(() => buildUserSelectConfig(t), [t]);

  // 输入框展示文本：用户名 - 性别 - 部门
  const displayText = useMemo(() => {
    if (!selectedUser) return "";

    const genderLabel = genderOptions.find(
      (item) => String(item.value) === String(selectedUser.gender)
    )?.label;

    return [selectedUser.username, genderLabel, selectedUser.deptName].filter(Boolean).join(" - ");
  }, [genderOptions, selectedUser]);

  return (
    <div className="page-container">
      <Alert className="mb-4" type="info" showIcon message={t("demo.tableSelect.alert")} />

      <TableSelect<UserItem>
        config={selectConfig}
        text={displayText}
        onConfirm={(selection) => setSelectedUser(selection[0])}
      />
    </div>
  );
}

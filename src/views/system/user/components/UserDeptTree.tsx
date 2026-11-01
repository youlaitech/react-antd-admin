import { useEffect, useMemo, useState } from "react";
import { Empty, Input, Tree } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import DeptAPI from "@/api/system/dept";
import type { OptionItem } from "@/api/common";

interface UserDeptTreeProps {
  /** 当前选中的部门 ID */
  value?: string | number;
  /** 选中部门回调 */
  onChange?: (value: string | number) => void;
  /** 点击节点后触发查询 */
  onNodeClick?: () => void;
}

/**
 * 树节点数据
 */
interface DeptTreeNode {
  key: string;
  title: string;
  children?: DeptTreeNode[];
}

/**
 * 部门选项转树数据
 */
function toTreeData(options: OptionItem[]): DeptTreeNode[] {
  return options.map((option) => ({
    key: String(option.value),
    title: option.label,
    children: option.children?.length ? toTreeData(option.children) : undefined,
  }));
}

/**
 * 用户管理左侧的部门树
 */
export default function UserDeptTree({ value, onChange, onNodeClick }: UserDeptTreeProps) {
  const { t } = useTranslation();

  const [deptList, setDeptList] = useState<OptionItem[]>([]);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    DeptAPI.getOptions()
      .then((data) => setDeptList(data ?? []))
      .catch((error) => console.warn(error));
  }, []);

  const treeData = useMemo(() => toTreeData(deptList), [deptList]);

  return (
    <div className="dept-tree">
      <Input
        value={keyword}
        allowClear
        prefix={<SearchOutlined />}
        placeholder={t("system.user.deptSearch")}
        onChange={(event) => setKeyword(event.target.value)}
      />

      {treeData.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("system.user.deptEmpty")} />
      ) : (
        <Tree
          className="dept-tree__body"
          treeData={treeData}
          defaultExpandAll
          filterTreeNode={(node) => String(node.title ?? "").includes(keyword)}
          selectedKeys={value === undefined ? [] : [String(value)]}
          onSelect={(keys) => {
            if (keys.length === 0) return;
            onChange?.(keys[0] as string);
            onNodeClick?.();
          }}
        />
      )}
    </div>
  );
}

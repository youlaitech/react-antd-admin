import { useMemo, useState } from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";

import { antdIcons } from "@/constants/antd-icons";
import { localIconNames } from "@/constants/icons";

interface IconSelectProps {
  /** 当前选中的图标，本地 SVG 存文件名，antd 图标存组件名 */
  value?: string;
  /** 选中回调 */
  onChange?: (value: string) => void;
}

/** 图标选择器 */
export default function IconSelect({ value, onChange }: IconSelectProps) {
  const [keyword, setKeyword] = useState("");

  const matchedLocalIcons = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    return localIconNames.filter((name) => name.includes(key));
  }, [keyword]);

  const matchedAntdIcons = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    return Object.entries(antdIcons).filter(([name]) => name.toLowerCase().includes(key));
  }, [keyword]);

  return (
    <div className="icon-select">
      <Input
        value={keyword}
        placeholder="搜索图标"
        allowClear
        prefix={<SearchOutlined />}
        onChange={(event) => setKeyword(event.target.value)}
      />

      <div className="icon-select__panel">
        {matchedLocalIcons.length === 0 && matchedAntdIcons.length === 0 && (
          <div className="icon-select__empty">未找到匹配的图标</div>
        )}

        {matchedLocalIcons.map((name) => (
          <button
            key={name}
            type="button"
            title={name}
            className={`icon-select__item${value === name ? " is-active" : ""}`}
            onClick={() => onChange?.(name)}
          >
            <i className={`i-svg:${name}`} />
          </button>
        ))}

        {matchedAntdIcons.map(([name, Icon]) => (
          <button
            key={name}
            type="button"
            title={name}
            className={`icon-select__item${value === name ? " is-active" : ""}`}
            onClick={() => onChange?.(name)}
          >
            <Icon />
          </button>
        ))}
      </div>
    </div>
  );
}

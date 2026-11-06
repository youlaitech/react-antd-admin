import { useMemo, useState } from "react";
import { Input, Popover } from "antd";
import { DownOutlined, SearchOutlined } from "@ant-design/icons";

import { antdIcons } from "@/constants/antd-icons";
import { localIconNames } from "@/constants/icons";

interface IconSelectProps {
  /** 当前选中的图标，本地 SVG 存文件名，antd 图标存组件名 */
  value?: string;
  /** 选中回调 */
  onChange?: (value: string) => void;
  /** 只读展示，查看态使用 */
  disabled?: boolean;
}

// 按图标名渲染预览：本地 SVG 用 i-svg 类名，antd 图标取组件
function renderPreview(name: string) {
  if (localIconNames.includes(name)) {
    return <i className={`i-svg:${name}`} />;
  }
  const AntIcon = antdIcons[name];
  return AntIcon ? <AntIcon /> : null;
}

/**
 * 图标选择器
 *
 * 点击触发区展开浮层，选中或点击外部收起
 */
export default function IconSelect({ value, onChange, disabled }: IconSelectProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  const matchedLocalIcons = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    return localIconNames.filter((name) => name.includes(key));
  }, [keyword]);

  const matchedAntdIcons = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    return Object.entries(antdIcons).filter(([name]) => name.toLowerCase().includes(key));
  }, [keyword]);

  // 选中后清空搜索词，下次展开直接看到全部图标
  const handleSelect = (name: string) => {
    onChange?.(name);
    setOpen(false);
    setKeyword("");
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setKeyword("");
  };

  const content = (
    <div className="icon-select__dropdown">
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
            onClick={() => handleSelect(name)}
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
            onClick={() => handleSelect(name)}
          >
            <Icon />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="icon-select">
      <Popover
        open={disabled ? false : open}
        trigger="click"
        placement="bottomLeft"
        content={content}
        onOpenChange={handleOpenChange}
      >
        <button type="button" className="icon-select__trigger" disabled={disabled}>
          <span className="icon-select__preview">{value ? renderPreview(value) : null}</span>
          <span className={`icon-select__name${value ? "" : " is-placeholder"}`}>
            {value || "点击选择图标"}
          </span>
          <DownOutlined className={`icon-select__arrow${open ? " is-open" : ""}`} />
        </button>
      </Popover>
    </div>
  );
}

import { useMemo, useState } from "react";
import { App as AntdApp, Card, Input, Tabs } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import MenuIcon from "@/components/MenuIcon";
import { antdIcons } from "@/constants/antd-icons";
import { localIconNames } from "@/constants/icons";

/**
 * 图标总览
 */
export default function Icons() {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const [keyword, setKeyword] = useState("");

  const matchedLocalIcons = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    return localIconNames.filter((name) => name.includes(key));
  }, [keyword]);

  const matchedAntdIcons = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    return Object.entries(antdIcons).filter(([name]) => name.toLowerCase().includes(key));
  }, [keyword]);

  /**
   * 复制图标用法
   */
  async function handleCopy(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      message.success(t("demo.icons.copySuccess"));
    } catch {
      message.warning(t("demo.icons.copyFail"));
    }
  }

  return (
    <div className="page-container">
      <Card className="page-content">
        <Input
          className="w-240px mb-4"
          allowClear
          value={keyword}
          prefix={<SearchOutlined />}
          placeholder={t("demo.icons.search")}
          onChange={(event) => setKeyword(event.target.value)}
        />

        <Tabs
          items={[
            {
              key: "local",
              label: `${t("demo.icons.local")}（${matchedLocalIcons.length}）`,
              children: (
                <div className="icon-grid">
                  {matchedLocalIcons.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className="icon-grid__item"
                      title={`<i class="i-svg:${name}" />`}
                      onClick={() => handleCopy(`i-svg:${name}`)}
                    >
                      <MenuIcon icon={name} />
                      <span className="icon-grid__name">{name}</span>
                    </button>
                  ))}
                </div>
              ),
            },
            {
              key: "antd",
              label: `${t("demo.icons.antd")}（${matchedAntdIcons.length}）`,
              children: (
                <div className="icon-grid">
                  {matchedAntdIcons.map(([name, Icon]) => (
                    <button
                      key={name}
                      type="button"
                      className="icon-grid__item"
                      title={`<${name} />`}
                      onClick={() => handleCopy(name)}
                    >
                      <span className="icon-grid__icon">
                        <Icon />
                      </span>
                      <span className="icon-grid__name">{name}</span>
                    </button>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

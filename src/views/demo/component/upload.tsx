import { useState } from "react";
import { Tag } from "antd";
import { FileOutlined, PictureOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import type { FileInfo } from "@/api/file";
import FileUpload from "@/components/Upload/FileUpload";
import MultiImageUpload from "@/components/Upload/MultiImageUpload";
import SingleImageUpload from "@/components/Upload/SingleImageUpload";
import "./upload.scss";

/** 演示用的初始图片地址 */
const DEMO_IMAGE = "https://s2.loli.net/2023/05/24/yNsxFC8rLHMZQcK.jpg";

interface DemoValuePanelProps {
  /** 绑定值的类型描述 */
  type: string;
  /** 绑定值 */
  value: unknown;
}

/**
 * 绑定值预览
 */
function DemoValuePanel({ type, value }: DemoValuePanelProps) {
  const { t } = useTranslation();
  const isEmpty = Array.isArray(value) ? value.length === 0 : !value;

  return (
    <aside className="value-panel">
      <div className="value-panel__caption">
        <span className="value-panel__label">{t("demo.upload.modelValue")}</span>
        <code className="value-panel__type">{type}</code>
      </div>
      <pre className={`value-panel__code${isEmpty ? " is-empty" : ""}`}>
        {isEmpty ? t("demo.upload.empty") : JSON.stringify(value, null, 2)}
      </pre>
    </aside>
  );
}

/**
 * 文件上传示例
 */
export default function UploadDemo() {
  const { t } = useTranslation();

  const [picUrl, setPicUrl] = useState<string>(DEMO_IMAGE);
  const [picUrls, setPicUrls] = useState<string[]>([DEMO_IMAGE]);
  const [fileList, setFileList] = useState<FileInfo[]>([{ name: "照片1.jpg", url: DEMO_IMAGE }]);

  const cards = [
    {
      key: "single",
      icon: <PictureOutlined />,
      iconTone: "primary",
      title: t("demo.upload.singleTitle"),
      desc: t("demo.upload.singleDesc"),
      tag: "SingleImageUpload",
      tagColor: "processing",
      stage: <SingleImageUpload value={picUrl} onChange={setPicUrl} />,
      panel: <DemoValuePanel type="string" value={picUrl} />,
    },
    {
      key: "multi",
      icon: <PictureOutlined />,
      iconTone: "success",
      title: t("demo.upload.multiTitle"),
      desc: t("demo.upload.multiDesc"),
      tag: "MultiImageUpload",
      tagColor: "success",
      stage: <MultiImageUpload value={picUrls} onChange={setPicUrls} limit={2} />,
      panel: <DemoValuePanel type="string[]" value={picUrls} />,
    },
    {
      key: "file",
      icon: <FileOutlined />,
      iconTone: "warning",
      title: t("demo.upload.fileTitle"),
      desc: t("demo.upload.fileDesc"),
      tag: "FileUpload",
      tagColor: "warning",
      stage: <FileUpload value={fileList} onChange={setFileList} />,
      panel: <DemoValuePanel type="FileInfo[]" value={fileList} />,
    },
  ];

  return (
    <div className="page-container upload-demo">
      <header className="page-header">
        <div>
          <h2 className="page-header__title">{t("demo.upload.title")}</h2>
          <p className="page-header__desc">{t("demo.upload.desc")}</p>
        </div>
      </header>

      {cards.map((card) => (
        <section className="demo-card" key={card.key}>
          <header className="demo-card__header">
            <span className={`demo-card__icon demo-card__icon--${card.iconTone}`}>{card.icon}</span>
            <div className="demo-card__meta">
              <h3 className="demo-card__title">{card.title}</h3>
              <p className="demo-card__desc">{card.desc}</p>
            </div>
            <Tag color={card.tagColor} className="m-0">
              {card.tag}
            </Tag>
          </header>

          <div className="demo-card__body">
            <div className="demo-card__stage">{card.stage}</div>
            {card.panel}
          </div>
        </section>
      ))}
    </div>
  );
}

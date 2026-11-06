import { Alert, Button, Input, Space } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useTagsViewStore } from "@/stores/tagsView";

/**
 * 三级菜单 B
 */
export default function LevelThreeB() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setViewTitle = useTagsViewStore((state) => state.setViewTitle);

  function goDetail(id: number) {
    const target = `/detail/${id}?message=msg${id}`;
    navigate(target);
    // 详情页的标题由参数决定，登记页签时用这条自定义标题盖掉菜单标题
    setViewTitle(target, t("demo.multiLevel.detailTag", { id }));
  }

  return (
    <div className="page-container">
      <div className="flex flex-col gap-5">
        <Alert type="info" showIcon message={t("demo.multiLevel.levelOne")} />
        <Alert type="success" showIcon message={t("demo.multiLevel.levelTwo")} />
        <Alert type="warning" showIcon message={t("demo.multiLevel.levelThreeB")} />
        <Input className="w-300px" placeholder={t("demo.multiLevel.cachePlaceholder")} />
        <Space>
          <Button type="primary" onClick={() => goDetail(1)}>
            {t("demo.multiLevel.toDetail")} 1
          </Button>
          <Button onClick={() => goDetail(2)}>{t("demo.multiLevel.toDetail")} 2</Button>
        </Space>
      </div>
    </div>
  );
}

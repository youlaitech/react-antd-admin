import { useEffect, useState } from "react";
import { Alert, Button, Card, Input, Modal, Space, Table, type TableProps } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { usePageActivate } from "@/hooks/usePageActivate";
import { listMembers } from "../data";
import type { MemberItem } from "../data";

/**
 * 页面跳转演示
 */
export default function RouteNavigate() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState("");
  const [members, setMembers] = useState<MemberItem[]>(() => listMembers());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");

  // 关键字变化后立即过滤
  useEffect(() => {
    setMembers(listMembers(keyword));
  }, [keyword]);

  // 从编辑页返回时重读数据：本页未开缓存时靠重新挂载，开了缓存就靠这次激活
  usePageActivate(() => setMembers(listMembers(keyword)));

  const columns: TableProps<MemberItem>["columns"] = [
    { title: t("demo.routeNavigate.name"), dataIndex: "name", width: 120 },
    { title: t("demo.routeNavigate.dept"), dataIndex: "dept" },
    { title: t("demo.routeNavigate.post"), dataIndex: "post" },
    {
      title: t("common.operate"),
      key: "operate",
      width: 200,
      align: "center",
      render: (_, record) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/route-example/edit/${record.id}`)}
          >
            {t("common.update")}
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setDialogTitle(`${record.name} · ${record.dept}`);
              setDialogOpen(true);
            }}
          >
            {t("demo.routeNavigate.dialogView")}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card className="page-content" title={t("demo.routeNavigate.listTitle")}>
        <Input
          value={keyword}
          allowClear
          placeholder={t("demo.routeNavigate.filterPlaceholder")}
          onChange={(event) => setKeyword(event.target.value)}
        />

        <Table<MemberItem>
          className="mt-4"
          rowKey="id"
          columns={columns}
          dataSource={members}
          pagination={false}
        />

        <Alert
          className="mt-4"
          type="info"
          showIcon
          message={t("demo.routeNavigate.compareTitle")}
          description={t("demo.routeNavigate.compareDesc")}
        />
      </Card>

      <Modal
        title={dialogTitle}
        width={420}
        open={dialogOpen}
        footer={null}
        onCancel={() => setDialogOpen(false)}
      >
        {t("demo.routeNavigate.dialogContent")}
      </Modal>
    </div>
  );
}

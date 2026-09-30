import { useEffect } from "react";
import { App as AntdApp, Button, Card, Form, Input, Space } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { getMember, updateMember } from "../data";
import { validateForm } from "@/utils/form";

import type { MemberItem } from "../data";

/** 独立编辑页 */
export default function RouteExampleEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<MemberItem>();

  useEffect(() => {
    const member = getMember(Number(id));
    if (!member) {
      message.warning(t("demo.routeNavigate.notFound"));
      navigate(-1);
      return;
    }
    form.setFieldsValue(member);
  }, [form, id, message, navigate, t]);

  async function handleSubmit() {
    const values = await validateForm(form);
    if (!values) return;

    updateMember({ ...values, id: Number(id) });
    message.success(t("common.saveSuccess"));
    navigate(-1);
  }

  return (
    <div className="page-container">
      <Card className="page-content" title={t("demo.routeNavigate.editTitle")}>
        <Form form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 12 }}>
          <Form.Item name="name" label={t("demo.routeNavigate.name")}>
            <Input placeholder={t("demo.routeNavigate.namePlaceholder")} />
          </Form.Item>
          <Form.Item name="dept" label={t("demo.routeNavigate.dept")}>
            <Input placeholder={t("demo.routeNavigate.deptPlaceholder")} />
          </Form.Item>
          <Form.Item name="post" label={t("demo.routeNavigate.post")}>
            <Input placeholder={t("demo.routeNavigate.postPlaceholder")} />
          </Form.Item>
          <Form.Item label={null}>
            <Space>
              <Button type="primary" onClick={handleSubmit}>
                {t("demo.routeNavigate.saveAndBack")}
              </Button>
              <Button onClick={() => navigate(-1)}>{t("common.cancel")}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

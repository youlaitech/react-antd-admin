import { useCallback, useEffect, useState } from "react";
import { App as AntdApp, Button, Result } from "antd";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import FormAPI from "@/api/form";
import type { FormRenderData } from "@/api/form";
import FormRenderer from "@/components/FormRenderer";
import { useAuth } from "@/hooks/useAuth";
import { findRouteMeta, findRoutePathByComponent } from "@/router/menu";
import { usePermissionStore } from "@/stores/permission";
import { useFormRenderer } from "./composables/useFormRenderer";

/** 表单填写页 */
export default function FormRender() {
  const { message } = AntdApp.useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const menuRoutes = usePermissionStore((state) => state.menuRoutes);
  const { hasPermission } = useAuth();

  // 菜单的「路由参数」配置存在 meta 里，未配置时退回 ?formKey=
  const metaParams = findRouteMeta(menuRoutes, pathname)?.params;
  const formKey = String(metaParams?.formKey ?? searchParams.get("formKey") ?? "");

  const [renderData, setRenderData] = useState<FormRenderData>();
  const [submitting, setSubmitting] = useState(false);

  const { rules, options, loading, submitted, setSubmitted, load, refill } = useFormRenderer(
    useCallback(() => FormAPI.getRender(formKey), [formKey])
  );

  useEffect(() => {
    if (!formKey) {
      message.error("缺少表单标识参数，请检查菜单路由参数配置");
      return;
    }

    load().then(setRenderData);
  }, [formKey, load, message]);

  /** 提交表单数据（校验通过后触发） */
  const handleSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      if (submitting) return;

      setSubmitting(true);
      try {
        await FormAPI.submitFormData(formKey, data);
        message.success("提交成功");
        setSubmitted(true);
      } finally {
        setSubmitting(false);
      }
    },
    [formKey, message, setSubmitted, submitting]
  );

  /** 跳转数据列表（按提交时间倒序，本次提交在首位） */
  const handleViewData = useCallback(() => {
    const path = findRoutePathByComponent(menuRoutes, "dynamic-form/data");
    if (!path) {
      message.error("路由未注册，请检查菜单配置后重试");
      return;
    }

    navigate({
      pathname: path,
      search: `?${new URLSearchParams({
        formKey,
        title: renderData?.formName ?? "表单数据",
      }).toString()}`,
    });
  }, [formKey, menuRoutes, message, navigate, renderData?.formName]);

  /** 无权限时不显示「查看已提交数据」入口 */
  const canViewData = hasPermission("form:data:list");

  return (
    <FormRenderer
      title={renderData?.formName ?? "表单填写"}
      version={renderData?.version}
      rules={rules}
      options={options}
      loading={loading}
      submitted={submitted}
      submitting={submitting}
      onFinish={handleSubmit}
      successSlot={
        <Result
          status="success"
          title="提交成功"
          subTitle="感谢您的填写，信息已成功提交"
          extra={
            <>
              <Button type="primary" onClick={refill}>
                继续填写
              </Button>
              {canViewData && <Button onClick={handleViewData}>查看已提交数据</Button>}
            </>
          }
        />
      }
    />
  );
}

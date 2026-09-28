import { useCallback, useEffect } from "react";
import { App as AntdApp, Button, Result } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";

import FormAPI from "@/api/form";
import FormRenderer from "@/components/FormRenderer";
import { useFormRenderer } from "./composables/useFormRenderer";

/** 表单预览页 */
export default function FormPreview() {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const formId = searchParams.get("id") ?? "";
  const title = searchParams.get("title") ?? "表单预览";

  const { rules, options, loading, submitted, setSubmitted, load, refill } = useFormRenderer(
    useCallback(() => FormAPI.getFormData(formId), [formId])
  );

  useEffect(() => {
    if (!formId) {
      message.error("缺少表单ID参数");
      return;
    }

    load();
  }, [formId, load, message]);

  /** 预览不落库，校验通过即进入成功态 */
  const handlePreviewSubmit = useCallback(() => setSubmitted(true), [setSubmitted]);

  return (
    <FormRenderer
      title={title}
      rules={rules}
      options={options}
      loading={loading}
      submitted={submitted}
      onFinish={handlePreviewSubmit}
      headerExtra={
        <Button type="primary" size="small" onClick={() => navigate(-1)}>
          返回设计器
        </Button>
      }
      successSlot={
        <Result
          status="success"
          title="预览提交成功"
          subTitle="预览模式下数据不会保存"
          extra={
            <>
              <Button onClick={refill}>继续填写</Button>
              <Button type="primary" onClick={() => navigate(-1)}>
                返回设计器
              </Button>
            </>
          }
        />
      }
    />
  );
}

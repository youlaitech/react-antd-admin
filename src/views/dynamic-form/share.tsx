import { useCallback, useEffect, useState } from "react";
import { Button, Card, Result } from "antd";
import { useParams } from "react-router-dom";

import FormAPI from "@/api/form";
import type { FormRenderData } from "@/api/form";
import FormRenderer from "@/components/FormRenderer";
import { useFormRenderer } from "./composables/useFormRenderer";

/** 公开表单填写页 */
export default function FormShare() {
  const { formKey = "" } = useParams();

  const [renderData, setRenderData] = useState<FormRenderData>();
  const [submitting, setSubmitting] = useState(false);
  /** 加载失败兜底文案（错误消息由拦截器统一弹出） */
  const [loadError, setLoadError] = useState("");

  const { rules, options, loading, submitted, setSubmitted, load, refill } = useFormRenderer(
    useCallback(() => FormAPI.getPublicRender(formKey), [formKey])
  );

  useEffect(() => {
    if (!formKey) {
      setLoadError("缺少表单标识参数");
      return;
    }

    load()
      .then(setRenderData)
      .catch(() => setLoadError("表单不存在或未开放公开访问"));
  }, [formKey, load]);

  /** 匿名提交表单数据（校验通过后触发） */
  const handleSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      if (submitting) return;

      setSubmitting(true);
      try {
        await FormAPI.submitPublicFormData(formKey, data);
        setSubmitted(true);
      } catch {
        // 失败不重复提示（拦截器已弹），停留填写态可重试
      } finally {
        setSubmitting(false);
      }
    },
    [formKey, setSubmitted, submitting]
  );

  return (
    <div className="share-page">
      {loadError ? (
        <Card className="share-page__card" variant="borderless">
          <Result
            status="warning"
            title="表单暂不可用"
            subTitle={loadError}
            extra={<div className="share-page__hint">请联系表单发布者确认链接是否有效</div>}
          />
        </Card>
      ) : (
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
                <Button type="primary" onClick={refill}>
                  继续填写
                </Button>
              }
            />
          }
        />
      )}
    </div>
  );
}

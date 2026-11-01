import type { FormInstance } from "antd";

/**
 * 校验表单，失败时返回 null
 */
export async function validateForm<T>(form: FormInstance<T>): Promise<T | null> {
  try {
    return await form.validateFields();
  } catch {
    return null;
  }
}

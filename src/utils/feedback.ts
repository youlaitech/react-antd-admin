import type { App } from "antd";
import { message as staticMessage } from "antd";

/** App.useApp() 返回的实例集合 */
type FeedbackApi = ReturnType<typeof App.useApp>;

let feedbackApi: FeedbackApi | null = null;

/**
 * 注入 antd 的提示实例
 */
export function setFeedbackApi(api: FeedbackApi) {
  feedbackApi = api;
}

/** 全局提示出口 */
export const feedback = {
  error(content: string) {
    (feedbackApi?.message ?? staticMessage).error(content);
  },

  success(content: string) {
    (feedbackApi?.message ?? staticMessage).success(content);
  },

  warning(content: string) {
    (feedbackApi?.message ?? staticMessage).warning(content);
  },
};

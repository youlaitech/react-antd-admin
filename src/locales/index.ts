import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { LanguageEnum } from "@/enums";
import { useAppStore } from "@/stores/app";
import enUS from "./en-US";
import zhCN from "./zh-CN";

const resources = {
  [LanguageEnum.ZH_CN]: { translation: zhCN },
  [LanguageEnum.EN_US]: { translation: enUS },
};

i18n.use(initReactI18next).init({
  resources,
  lng: useAppStore.getState().language,
  fallbackLng: LanguageEnum.ZH_CN,
  interpolation: { escapeValue: false },
});

// 语言切换时同步 i18n 实例
useAppStore.subscribe((state, prevState) => {
  if (state.language !== prevState.language) {
    i18n.changeLanguage(state.language);
  }
});

export default i18n;

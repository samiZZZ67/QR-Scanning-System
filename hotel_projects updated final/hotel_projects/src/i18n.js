import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import { applyDocumentLanguage } from "./i18nDirection.js";

export const supportedLanguages = [
  { code: "en", label: "English" },
  { code: "am", label: "አማርኛ" },
  { code: "ar", label: "العربية" }
];

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: supportedLanguages.map((language) => language.code),
    ns: ["common", "customer", "kitchen", "waiter", "admin"],
    defaultNS: "common",
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json"
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"]
    },
    interpolation: {
      escapeValue: false
    }
  });

i18n.on("languageChanged", applyDocumentLanguage);
applyDocumentLanguage(i18n.resolvedLanguage || i18n.language || "en");

export default i18n;

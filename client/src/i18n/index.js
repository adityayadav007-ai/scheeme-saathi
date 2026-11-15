import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import english from "./en.json";
import hindi from "./hi.json";

const languageStorageKey = "scheme-saathi-language";

function savedLanguage() {
  try {
    return localStorage.getItem(languageStorageKey) === "hi" ? "hi" : "en";
  } catch {
    return "en";
  }
}

const initialLanguage = savedLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: english },
    hi: { translation: hindi }
  },
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  initImmediate: false
});

function persistLanguage(language) {
  document.documentElement.lang = language;
  try {
    localStorage.setItem(languageStorageKey, language);
  } catch {
    // Language changes still apply for the current page if storage is unavailable.
  }
}

document.documentElement.lang = initialLanguage;
i18n.on("languageChanged", persistLanguage);

export default i18n;

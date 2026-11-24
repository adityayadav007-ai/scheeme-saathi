import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import english from "../locales/en/translation.json";
import hindi from "../locales/hi/translation.json";
import marathi from "../locales/mr/translation.json";
import bengali from "../locales/bn/translation.json";
import tamil from "../locales/ta/translation.json";
import telugu from "../locales/te/translation.json";
import gujarati from "../locales/gu/translation.json";
import kannada from "../locales/kn/translation.json";
import malayalam from "../locales/ml/translation.json";
import punjabi from "../locales/pa/translation.json";
import urdu from "../locales/ur/translation.json";

export const supportedLanguages = [
  "en",
  "hi",
  "mr",
  "bn",
  "ta",
  "te",
  "gu",
  "kn",
  "ml",
  "pa",
  "ur"
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: english },
      hi: { translation: hindi },
      mr: { translation: marathi },
      bn: { translation: bengali },
      ta: { translation: tamil },
      te: { translation: telugu },
      gu: { translation: gujarati },
      kn: { translation: kannada },
      ml: { translation: malayalam },
      pa: { translation: punjabi },
      ur: { translation: urdu }
    },
    fallbackLng: "en",
    supportedLngs: supportedLanguages,
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "scheme-saathi-language",
      caches: ["localStorage"]
    },
    interpolation: { escapeValue: false },
    initImmediate: false
  });

function updateDocumentLanguage(language) {
  const resolvedLanguage = supportedLanguages.includes(language)
    ? language
    : "en";
  document.documentElement.lang = resolvedLanguage;
  document.documentElement.dir = resolvedLanguage === "ur" ? "rtl" : "ltr";
  try {
    localStorage.setItem("scheme-saathi-language", resolvedLanguage);
  } catch {
    // The language change still applies when browser storage is unavailable.
  }
}

i18n.on("languageChanged", updateDocumentLanguage);
updateDocumentLanguage(i18n.resolvedLanguage || i18n.language);

export default i18n;

import { useTranslation } from "react-i18next";
import { supportedLanguages } from "../i18n/index.js";

const languageNames = {
  en: "English",
  hi: "हिन्दी",
  mr: "मराठी",
  bn: "বাংলা",
  ta: "தமிழ்",
  te: "తెలుగు",
  gu: "ગુજરાતી",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  pa: "ਪੰਜਾਬੀ",
  ur: "اردو"
};

export default function LanguageToggle() {
  const { t, i18n } = useTranslation();

  return (
    <label className="inline-flex min-h-10 items-center rounded-xl border border-slate-300 bg-white px-2">
      <span className="sr-only">{t("accessibility.languageToggle")}</span>
      <select
        aria-label={t("accessibility.languageToggle")}
        value={i18n.resolvedLanguage || "en"}
        onChange={(event) => i18n.changeLanguage(event.target.value)}
        className="min-h-9 max-w-36 cursor-pointer rounded-lg border-0 bg-transparent px-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
      >
        {supportedLanguages.map((language) => (
          <option key={language} value={language} lang={language}>
            {languageNames[language]}
          </option>
        ))}
      </select>
    </label>
  );
}

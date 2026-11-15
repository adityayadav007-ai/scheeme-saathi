import { useTranslation } from "react-i18next";

export default function LanguageToggle() {
  const { t, i18n } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t("accessibility.languageToggle")}
      className="inline-flex min-h-10 items-center rounded-xl border border-slate-300 bg-white p-1"
    >
      {["en", "hi"].map((language) => (
        <button
          key={language}
          type="button"
          lang={language}
          aria-pressed={i18n.resolvedLanguage === language}
          onClick={() => i18n.changeLanguage(language)}
          className={`min-h-8 rounded-lg px-2.5 text-xs font-bold sm:px-3 sm:text-sm ${
            i18n.resolvedLanguage === language
              ? "bg-teal-800 text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          {t(`language.${language === "en" ? "english" : "hindi"}`)}
        </button>
      ))}
    </div>
  );
}

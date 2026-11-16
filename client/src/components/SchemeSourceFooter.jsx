import { useTranslation } from "react-i18next";
import { getSafeGovUrl } from "../utils/safeLinks.js";

function formatDate(value, language, unavailableText) {
  if (!value) return unavailableText;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return unavailableText;
  const locale = language === "hi" ? "hi-IN" : "en-IN";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

export default function SchemeSourceFooter({
  scheme = {},
  showOfficialLink = true,
  showVerification = true
}) {
  const { t, i18n } = useTranslation();
  const data = scheme && typeof scheme === "object" ? scheme : {};
  const officialUrl = getSafeGovUrl(data.officialLink);
  const sourceUrl = getSafeGovUrl(data.sourceUrl);

  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        {showOfficialLink ? (
          officialUrl ? (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("scheme.openOfficialAria", {
                name: data.name || t("scheme.unnamed")
              })}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-teal-800 px-5 text-sm font-bold text-white transition hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              {t("scheme.official")}
              <span className="sr-only">{t("accessibility.opensNewTab")}</span>
            </a>
          ) : (
            <span className="rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
              {t("scheme.linkUnavailable")}
            </span>
          )
        ) : null}
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-teal-900 underline decoration-teal-300 underline-offset-4 hover:decoration-teal-800"
          >
            {t("scheme.source")}
            <span className="sr-only">{t("accessibility.opensNewTab")}</span>
          </a>
        ) : (
          <span className="text-sm text-slate-500">
            {t("scheme.sourceUnavailable")}
          </span>
        )}
        {data.linkStatus === "broken" && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950">
            {t("scheme.linkUnderReview")}
          </span>
        )}
        {showVerification && (data.verified ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-950">
            {t("scheme.verified")}
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950">
            {t("scheme.unverified")}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">
        {t("scheme.lastUpdated")}:{" "}
        {formatDate(
          data.lastSyncedAt,
          i18n.resolvedLanguage,
          t("scheme.dateUnavailable")
        )}
      </p>
      {data.linkStatus === "broken" && (
        <p className="mt-2 text-xs leading-5 text-amber-950">
          {t("scheme.linkMayNotWork")}
        </p>
      )}
      <p className="mt-2 text-xs leading-5 text-slate-700">
        {t("scheme.warning")}
      </p>
    </div>
  );
}

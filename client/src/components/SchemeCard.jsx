import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SchemeSourceFooter from "./SchemeSourceFooter.jsx";
import {
  translateCriterion,
  translateMatchReason
} from "../utils/translateMatch.js";

export default function SchemeCard({ scheme }) {
  const { t } = useTranslation();

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to={`/scheme/${encodeURIComponent(scheme.slug)}`}
            className="text-lg font-bold leading-7 text-teal-950 underline decoration-transparent underline-offset-4 hover:decoration-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            {scheme.name}
          </Link>
          {scheme.ministry && (
            <p className="mt-1 text-sm text-slate-600">{scheme.ministry}</p>
          )}
        </div>
        {scheme.category && (
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-950">
            {scheme.category}
          </span>
        )}
      </div>
      {scheme.description && (
        <p className="mt-4 leading-6 text-slate-700">{scheme.description}</p>
      )}
      {scheme.benefits && (
        <section className="mt-4">
          <h3 className="text-sm font-bold text-slate-900">
            {t("scheme.benefits")}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            {scheme.benefits}
          </p>
        </section>
      )}
      {scheme.eligibilityText && (
        <section className="mt-4 rounded-lg bg-slate-50 p-3">
          <h3 className="text-sm font-bold text-slate-900">
            {t("scheme.eligibility")}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            {scheme.eligibilityText}
          </p>
        </section>
      )}
      {scheme.documents?.length > 0 && (
        <section className="mt-4">
          <h3 className="text-sm font-bold text-slate-900">
            {t("scheme.documents")}
          </h3>
          <ul className="mt-1 list-inside list-disc text-sm leading-6 text-slate-700">
            {scheme.documents.slice(0, 3).map((document) => (
              <li key={document}>{document}</li>
            ))}
            {scheme.documents.length > 3 && (
              <li>
                {t("scheme.moreDocuments", {
                  count: scheme.documents.length - 3
                })}
              </li>
            )}
          </ul>
        </section>
      )}
      {scheme.matchedOn?.length > 0 && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          <span className="font-bold">{t("results.matchedOnLabel")}</span>{" "}
          {scheme.matchedOn
            .map((criterion) => translateCriterion(t, criterion))
            .join(", ")}
        </p>
      )}
      {scheme.failedReason && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <span className="font-bold">{t("results.pleaseCheckLabel")}</span>{" "}
          {translateMatchReason(t, scheme.failedReason)}
        </p>
      )}
      <SchemeSourceFooter scheme={scheme} />
    </article>
  );
}

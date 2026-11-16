import { useId } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SchemeSourceFooter from "./SchemeSourceFooter.jsx";
import {
  translateCriterion,
  translateMatchReason
} from "../utils/translateMatch.js";
import { getSafeGovUrl } from "../utils/safeLinks.js";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function shortBenefit(value) {
  const benefit = text(value);
  if (!benefit) return "";
  const sentence = benefit.match(/^.*?[.!?](?:\s|$)/)?.[0].trim() || benefit;
  return sentence.length > 140 ? `${sentence.slice(0, 137).trimEnd()}…` : sentence;
}

export default function SchemeCard({ scheme: rawScheme }) {
  const { t } = useTranslation();
  const location = useLocation();
  const titleId = useId();
  const scheme =
    rawScheme && typeof rawScheme === "object" ? rawScheme : {};
  const name = text(scheme.name) || t("scheme.unnamed");
  const slug = text(scheme.slug);
  const category = text(scheme.category);
  const level = text(scheme.level);
  const ministry = text(scheme.ministry);
  const description = text(scheme.description);
  const benefit = shortBenefit(scheme.benefits);
  const documents = Array.isArray(scheme.documents)
    ? scheme.documents.map(text).filter(Boolean)
    : [];
  const officialUrl = getSafeGovUrl(scheme.officialLink);
  const returnTo =
    location.pathname === "/schemes"
      ? `${location.pathname}${location.search}`
      : undefined;

  return (
    <article
      aria-labelledby={titleId}
      className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap gap-2">
        {category && (
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-950">
            {category}
          </span>
        )}
        {level && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {level}
          </span>
        )}
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            scheme.verified
              ? "bg-emerald-100 text-emerald-950"
              : "bg-amber-100 text-amber-950"
          }`}
        >
          {scheme.verified ? t("scheme.verified") : t("scheme.unverified")}
        </span>
      </div>

      <h2
        id={titleId}
        className="mt-3 text-lg font-bold leading-7 text-teal-950"
      >
        {slug ? (
          <Link
            to={`/scheme/${encodeURIComponent(slug)}`}
            state={returnTo ? { returnTo } : undefined}
            className="underline decoration-transparent underline-offset-4 hover:decoration-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            {name}
          </Link>
        ) : (
          name
        )}
      </h2>
      {ministry && (
        <p className="mt-1 text-sm text-slate-600">
          {t("scheme.ministry")}: {ministry}
        </p>
      )}
      {description && (
        <p className="mt-4 line-clamp-3 leading-6 text-slate-700">
          {description}
        </p>
      )}
      {benefit && (
        <section className="mt-4">
          <h3 className="text-sm font-bold text-slate-900">
            {t("scheme.keyBenefit")}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-700">{benefit}</p>
        </section>
      )}
      {text(scheme.eligibilityText) && (
        <section className="mt-4 rounded-lg bg-slate-50 p-3">
          <h3 className="text-sm font-bold text-slate-900">
            {t("scheme.eligibility")}
          </h3>
          <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-700">
            {text(scheme.eligibilityText)}
          </p>
        </section>
      )}
      {documents.length > 0 && (
        <section className="mt-4">
          <h3 className="text-sm font-bold text-slate-900">
            {t("scheme.documents")}
          </h3>
          <ul className="mt-1 list-inside list-disc text-sm leading-6 text-slate-700">
            {documents.slice(0, 3).map((document, index) => (
                <li key={`${document}-${index}`}>{text(document)}</li>
              ))}
            {documents.length > 3 && (
              <li>
                {t("scheme.moreDocuments", {
                  count: documents.length - 3
                })}
              </li>
            )}
          </ul>
        </section>
      )}
      {Array.isArray(scheme.matchedOn) && scheme.matchedOn.length > 0 && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          <span className="font-bold">{t("results.matchedOnLabel")}</span>{" "}
          {scheme.matchedOn
            .filter((criterion) => typeof criterion === "string")
            .map((criterion) => translateCriterion(t, criterion))
            .join(", ")}
        </p>
      )}
      {text(scheme.failedReason) && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <span className="font-bold">{t("results.pleaseCheckLabel")}</span>{" "}
          {translateMatchReason(t, scheme.failedReason)}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        {slug ? (
          <Link
            to={`/scheme/${encodeURIComponent(slug)}`}
            state={returnTo ? { returnTo } : undefined}
            aria-label={t("scheme.viewDetailsAria", { name })}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-teal-800 px-4 text-sm font-bold text-teal-900 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            {t("scheme.viewDetails")}
          </Link>
        ) : (
          <span className="inline-flex min-h-11 items-center rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-600">
            {t("scheme.detailsUnavailable")}
          </span>
        )}
        {officialUrl ? (
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("scheme.openOfficialAria", { name })}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-teal-800 px-4 text-sm font-bold text-white hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            {t("scheme.official")}
            <span className="sr-only">{t("accessibility.opensNewTab")}</span>
          </a>
        ) : (
          <span className="inline-flex min-h-11 items-center rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-600">
            {t("scheme.linkUnavailable")}
          </span>
        )}
      </div>

      <SchemeSourceFooter
        scheme={scheme}
        showOfficialLink={false}
        showVerification={false}
      />
    </article>
  );
}

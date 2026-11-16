import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import PageMeta from "../components/PageMeta.jsx";
import RequestError from "../components/RequestError.jsx";
import SchemeSourceFooter from "../components/SchemeSourceFooter.jsx";
import { useScheme } from "../hooks/useSchemes.js";
import { getSafeGovUrl } from "../utils/safeLinks.js";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function values(value) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function ageRange(eligibility, t) {
  const min = eligibility?.minAge;
  const max = eligibility?.maxAge;
  const hasMin = min !== null && min !== undefined && min !== "";
  const hasMax = max !== null && max !== undefined && max !== "";
  if (!hasMin && !hasMax) return "";
  if (hasMin && hasMax) {
    return t("scheme.ageRange", { min, max });
  }
  return hasMin
    ? t("scheme.ageAndAbove", { age: min })
    : t("scheme.ageUpTo", { age: max });
}

function structuredEligibility(eligibility, t) {
  const data =
    eligibility && typeof eligibility === "object" ? eligibility : {};
  const details = [];
  const age = ageRange(data, t);
  if (age) details.push([t("scheme.eligibilityDetails.age"), age]);

  const listFields = [
    ["gender", "gender"],
    ["category", "category"],
    ["occupation", "occupation"],
    ["area", "area"]
  ];
  for (const [field, labelKey] of listFields) {
    const items = values(data[field]);
    if (items.length) {
      details.push([
        t(`scheme.eligibilityDetails.${labelKey}`),
        items.join(", ")
      ]);
    }
  }

  const income = Number(data.maxIncome);
  if (
    data.maxIncome !== null &&
    data.maxIncome !== undefined &&
    data.maxIncome !== "" &&
    Number.isFinite(income)
  ) {
    const amount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(income);
    details.push([
      t("scheme.eligibilityDetails.income"),
      t("scheme.incomeUpTo", { amount })
    ]);
  }

  for (const [field, labelKey] of [
    ["requiresLand", "land"],
    ["requiresBPL", "bpl"],
    ["disability", "disability"]
  ]) {
    if (typeof data[field] === "boolean") {
      details.push([
        t(`scheme.eligibilityDetails.${labelKey}`),
        t(data[field] ? "scheme.required" : "scheme.notRequired")
      ]);
    }
  }

  return details;
}

function OfficialLink({ scheme, large = false }) {
  const { t } = useTranslation();
  const url = getSafeGovUrl(scheme?.officialLink);

  if (!url) {
    return (
      <span className="inline-flex min-h-11 items-center rounded-xl bg-slate-100 px-5 text-sm font-semibold text-slate-600">
        {t("scheme.linkUnavailable")}
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("scheme.openOfficialAria", {
        name: text(scheme?.name) || t("scheme.unnamed")
      })}
      className={`inline-flex items-center justify-center rounded-xl bg-teal-800 font-bold text-white transition hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
        large ? "min-h-14 px-6 text-base" : "min-h-12 px-5 text-sm"
      }`}
    >
      {t("scheme.goOfficial")}
      <span className="sr-only">{t("accessibility.opensNewTab")}</span>
    </a>
  );
}

function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8">
      <h1 className="text-2xl font-bold text-slate-950">
        {t("scheme.notFound")}
      </h1>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to="/schemes"
          className="inline-flex min-h-11 items-center rounded-xl bg-teal-800 px-5 font-bold text-white hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          {t("notFound.browse")}
        </Link>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-5 font-bold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          {t("notFound.home")}
        </Link>
      </div>
    </div>
  );
}

function Detail({ scheme }) {
  const { t } = useTranslation();
  const data = scheme && typeof scheme === "object" ? scheme : {};
  const details = [
    [t("scheme.benefits"), text(data.benefits)],
    [t("scheme.eligibility"), text(data.eligibilityText)],
    [t("scheme.howToApply"), text(data.howToApply)]
  ].filter(([, value]) => value);
  const eligibilityDetails = structuredEligibility(data.eligibility, t);
  const documents = values(data.documents);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-wrap gap-2">
        {text(data.category) && (
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-950">
            {text(data.category)}
          </span>
        )}
        {text(data.level) && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {text(data.level)}
          </span>
        )}
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            data.verified
              ? "bg-emerald-100 text-emerald-950"
              : "bg-amber-100 text-amber-950"
          }`}
        >
          {data.verified ? t("scheme.verified") : t("scheme.unverified")}
        </span>
      </div>

      <div className="mt-5">
        <OfficialLink scheme={data} large />
      </div>
      {data.needsReview && (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
          {t("scheme.needsReviewNote")}
        </p>
      )}

      <h1 className="mt-5 break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
        {text(data.name) || t("scheme.unnamed")}
      </h1>
      {text(data.ministry) && (
        <p className="mt-2 text-sm font-semibold text-slate-600">
          {t("scheme.ministry")}: {text(data.ministry)}
        </p>
      )}
      {text(data.description) && (
        <p className="mt-6 text-lg leading-8 text-slate-700">
          {text(data.description)}
        </p>
      )}

      <div className="mt-7 space-y-6">
        {details.map(([title, value]) => (
          <section key={title}>
            <h2 className="text-lg font-bold text-slate-950">{title}</h2>
            <p className="mt-2 whitespace-pre-line leading-7 text-slate-700">
              {value}
            </p>
          </section>
        ))}
        {eligibilityDetails.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-950">
              {t("scheme.eligibilityDetailsTitle")}
            </h2>
            <dl className="mt-2 divide-y divide-slate-200 rounded-xl border border-slate-200">
              {eligibilityDetails.map(([label, value]) => (
                <div
                  key={label}
                  className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(10rem,0.4fr)_1fr] sm:gap-4"
                >
                  <dt className="text-sm font-semibold text-slate-600">
                    {label}
                  </dt>
                  <dd className="break-words text-sm text-slate-900">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        {documents.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-950">
              {t("scheme.documents")}
            </h2>
            <ul className="mt-2 list-inside list-disc space-y-1 leading-7 text-slate-700">
              {documents.map((document, index) => (
                <li key={`${document}-${index}`}>{document}</li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="mt-8">
        <OfficialLink scheme={data} large />
      </div>
      <SchemeSourceFooter scheme={data} showOfficialLink={false} />
    </article>
  );
}

export default function SchemeDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const location = useLocation();
  const query = useScheme(slug);
  const titleName = text(query.data?.name) || t("brand");
  const returnTo = location.state?.returnTo;
  const backTo =
    typeof returnTo === "string" && returnTo.startsWith("/schemes")
      ? returnTo
      : "/schemes";
  const notFound =
    query.error?.response?.status === 404 ||
    (!query.isLoading && !query.isError && !query.data);

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <PageMeta
        title={t("seo.schemeTitle", { name: titleName })}
        description={
          text(query.data?.description) ||
          t("seo.schemeDescription", { name: titleName })
        }
      />
      <Link
        to={backTo}
        className="inline-flex min-h-11 items-center text-sm font-bold text-teal-900 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        {t("scheme.backToBrowse")}
      </Link>
      <div className="mt-5">
        {query.isLoading ? (
          <LoadingSkeleton count={1} />
        ) : notFound ? (
          <NotFound />
        ) : query.isError ? (
          <RequestError
            message={t("errors.loadSchemes")}
            onRetry={() => query.refetch()}
          />
        ) : (
          <Detail scheme={query.data} />
        )}
      </div>
    </section>
  );
}

import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import PageMeta from "../components/PageMeta.jsx";
import RequestError from "../components/RequestError.jsx";
import SchemeSourceFooter from "../components/SchemeSourceFooter.jsx";
import { useScheme } from "../hooks/useSchemes.js";

function Detail({ scheme }) {
  const { t } = useTranslation();
  const details = [
    [t("scheme.benefits"), scheme.benefits],
    [t("scheme.eligibility"), scheme.eligibilityText],
    [t("scheme.howToApply"), scheme.howToApply]
  ].filter(([, value]) => value);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-wrap gap-2">
        {scheme.category && (
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-950">
            {scheme.category}
          </span>
        )}
        {scheme.level && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {scheme.level}
          </span>
        )}
      </div>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
        {scheme.name}
      </h1>
      {scheme.ministry && (
        <p className="mt-2 text-sm font-semibold text-slate-600">
          {t("scheme.ministry")}: {scheme.ministry}
        </p>
      )}
      {scheme.description && (
        <p className="mt-6 text-lg leading-8 text-slate-700">
          {scheme.description}
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
        {scheme.documents?.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-950">
              {t("scheme.documents")}
            </h2>
            <ul className="mt-2 list-inside list-disc space-y-1 leading-7 text-slate-700">
              {scheme.documents.map((document) => (
                <li key={document}>{document}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <SchemeSourceFooter scheme={scheme} />
    </article>
  );
}

export default function SchemeDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const query = useScheme(slug);
  const titleName = query.data?.name ?? t("brand");

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <PageMeta
        title={t("seo.schemeTitle", { name: titleName })}
        description={
          query.data?.description ||
          t("seo.schemeDescription", { name: titleName })
        }
      />
      <Link
        to="/schemes"
        className="inline-flex min-h-11 items-center text-sm font-bold text-teal-900 underline underline-offset-4"
      >
        {t("scheme.backToBrowse")}
      </Link>
      <div className="mt-5">
        {query.isLoading || (!query.data && !query.isError) ? (
          <LoadingSkeleton count={1} />
        ) : query.isError ? (
          query.error?.response?.status === 404 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h1 className="text-2xl font-bold text-slate-950">
                {t("scheme.notFound")}
              </h1>
            </div>
          ) : (
            <RequestError
              message={t("errors.loadSchemes")}
              onRetry={() => query.refetch()}
            />
          )
        ) : (
          <Detail scheme={query.data} />
        )}
      </div>
    </section>
  );
}

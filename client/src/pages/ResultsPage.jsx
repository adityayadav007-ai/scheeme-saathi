import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import PageMeta from "../components/PageMeta.jsx";
import RequestError from "../components/RequestError.jsx";
import SchemeCard from "../components/SchemeCard.jsx";
import { useMatchSchemes } from "../hooks/useMatchSchemes.js";
import { clearSessionAnswers, readSessionAnswers } from "../utils/wizard.js";

function isComplete(answers) {
  return Boolean(
    answers &&
      answers.age !== "" &&
      answers.age !== null &&
      answers.age !== undefined &&
      Number.isInteger(Number(answers.age)) &&
      Number(answers.age) >= 0 &&
      Number(answers.age) <= 120 &&
      answers.state &&
      answers.area &&
      answers.income !== "" &&
      answers.income !== null &&
      answers.income !== undefined &&
      Number.isFinite(Number(answers.income))
  );
}

function EmptyResults() {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h2 className="text-xl font-bold text-slate-950">
        {t("results.emptyTitle")}
      </h2>
      <p className="mx-auto mt-2 max-w-xl leading-6 text-slate-600">
        {t("results.emptyText")}
      </p>
      <a
        href="https://www.myscheme.gov.in"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-800 px-5 font-bold text-white hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        {t("results.browseGovernment")}
        <span className="sr-only">{t("accessibility.opensNewTab")}</span>
      </a>
    </div>
  );
}

export default function ResultsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const answers = readSessionAnswers();
  const complete = isComplete(answers);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const query = useMatchSchemes(complete ? answers : null, {
    enabled: complete
  });

  const filtered = useMemo(() => {
    const filterList = (schemes = []) =>
      schemes.filter((scheme) => {
        const searchMatches = `${scheme.name ?? ""} ${scheme.description ?? ""} ${scheme.ministry ?? ""}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());
        return searchMatches && (!category || scheme.category === category);
      });

    return {
      eligible: filterList(query.data?.eligible),
      partial: filterList(query.data?.partial)
    };
  }, [category, query.data, search]);

  function startOver() {
    clearSessionAnswers();
    queryClient.removeQueries({ queryKey: ["match"] });
    navigate("/check");
  }

  if (!complete) return <Navigate to="/check" replace />;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <PageMeta
        title={t("seo.resultsTitle")}
        description={t("seo.resultsDescription")}
      />
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-teal-800">
            {t("brand")}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {t("results.title")}
          </h1>
          <p className="mt-2 max-w-2xl leading-6 text-slate-600">
            {t("results.intro")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/check"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            {t("results.edit")}
          </Link>
          <button
            type="button"
            onClick={startOver}
            className="min-h-11 rounded-xl bg-teal-800 px-4 text-sm font-bold text-white hover:bg-teal-900"
          >
            {t("results.startOver")}
          </button>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          <label htmlFor="results-search" className="sr-only">
            {t("results.search")}
          </label>
          <input
            id="results-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("results.search")}
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          />
        </div>
        <div>
          <label htmlFor="results-category" className="sr-only">
            {t("results.category")}
          </label>
          <select
            id="results-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          >
            <option value="">{t("results.allCategories")}</option>
            {t("categories", { returnObjects: true }).map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {query.isLoading || (!query.data && !query.isError) ? (
        <div className="mt-8">
          <LoadingSkeleton />
        </div>
      ) : query.isError ? (
        <div className="mt-8">
          <RequestError
            message={t("errors.loadSchemes")}
            onRetry={() => query.refetch()}
          />
        </div>
      ) : (
        <div className="mt-9 space-y-10">
          {filtered.eligible.length === 0 && filtered.partial.length === 0 ? (
            <EmptyResults />
          ) : (
            <>
              <section aria-labelledby="eligible-heading">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                  <h2
                    id="eligible-heading"
                    className="text-2xl font-black tracking-tight text-slate-950"
                  >
                    {t("results.eligible")}
                  </h2>
                  {filtered.eligible.length > 0 && (
                    <span className="text-sm font-semibold text-slate-500">
                      {filtered.eligible.length}
                    </span>
                  )}
                </div>
                {filtered.eligible.length > 0 ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {filtered.eligible.map((scheme) => (
                      <SchemeCard key={scheme.slug} scheme={scheme} />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-slate-100 p-4 text-sm leading-6 text-slate-700">
                    {t("results.noEligible")}
                  </p>
                )}
              </section>

              {filtered.partial.length > 0 && (
                <section aria-labelledby="partial-heading">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                    <h2
                      id="partial-heading"
                      className="text-2xl font-black tracking-tight text-slate-950"
                    >
                      {t("results.partial")}
                    </h2>
                    <span className="text-sm font-semibold text-slate-500">
                      {filtered.partial.length}
                    </span>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {filtered.partial.map((scheme) => (
                      <SchemeCard key={scheme.slug} scheme={scheme} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import PageMeta from "../components/PageMeta.jsx";
import RequestError from "../components/RequestError.jsx";
import SchemeCard from "../components/SchemeCard.jsx";
import { useSchemes } from "../hooks/useSchemes.js";

function positivePage(value) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default function BrowseSchemesPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const page = positivePage(searchParams.get("page"));
  const [search, setSearch] = useState(queryFromUrl);

  useEffect(() => {
    setSearch(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    if (search.trim() === queryFromUrl) return undefined;

    const timer = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams);
      const query = search.trim();
      if (query) nextParams.set("q", query);
      else nextParams.delete("q");
      nextParams.delete("page");
      setSearchParams(nextParams, { replace: true });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [queryFromUrl, search, searchParams, setSearchParams]);

  const categories = t("categories", { returnObjects: true });
  const categoryOptions = Array.isArray(categories) ? categories : [];
  const params = {
    ...(queryFromUrl ? { q: queryFromUrl } : {}),
    ...(category ? { category } : {}),
    page,
    limit: 12
  };
  const query = useSchemes(params);
  const schemes = Array.isArray(query.data?.data) ? query.data.data : [];
  const pagination = query.data?.pagination ?? {};
  const total = Number.isFinite(Number(pagination?.total))
    ? Number(pagination.total)
    : 0;
  const totalPages = Math.max(
    Number.isSafeInteger(Number(pagination?.totalPages))
      ? Number(pagination.totalPages)
      : 1,
    1
  );
  const firstPageNumber = Math.max(
    1,
    Math.min(page - 3, totalPages - 6)
  );
  const lastPageNumber = Math.min(totalPages, firstPageNumber + 6);
  const pageNumbers = Array.from(
    { length: lastPageNumber - firstPageNumber + 1 },
    (_, index) => firstPageNumber + index
  );

  function updateCategory(value) {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set("category", value);
    else nextParams.delete("category");
    nextParams.delete("page");
    setSearchParams(nextParams, { replace: true });
  }

  function updatePage(value) {
    const nextParams = new URLSearchParams(searchParams);
    if (value > 1) nextParams.set("page", String(value));
    else nextParams.delete("page");
    setSearchParams(nextParams);
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <PageMeta
        title={t("seo.browseTitle")}
        description={t("seo.browseDescription")}
      />
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-widest text-teal-800">
          {t("brand")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          {t("browse.title")}
        </h1>
        <p className="mt-2 leading-6 text-slate-600">{t("browse.intro")}</p>
      </div>

      <div className="mt-7 max-w-3xl">
        <label htmlFor="browse-search" className="sr-only">
          {t("browse.search")}
        </label>
        <input
          id="browse-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("browse.search")}
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
        />
      </div>

      <div
        role="group"
        aria-label={t("browse.category")}
        className="mt-4 flex flex-wrap gap-2"
      >
        <button
          type="button"
          aria-pressed={!category}
          onClick={() => updateCategory("")}
          className={`min-h-10 rounded-full border px-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
            !category
              ? "border-teal-800 bg-teal-800 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {t("browse.allCategories")}
        </button>
        {categoryOptions.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={category === item.value}
            onClick={() =>
              updateCategory(category === item.value ? "" : item.value)
            }
            className={`min-h-10 rounded-full border px-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
              category === item.value
                ? "border-teal-800 bg-teal-800 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {query.isLoading || (!query.data && !query.isError) ? (
        <div className="mt-8">
          <LoadingSkeleton count={6} grid />
        </div>
      ) : query.isError ? (
        <div className="mt-8">
          <RequestError
            message={t("errors.loadSchemes")}
            onRetry={() => query.refetch()}
          />
        </div>
      ) : schemes.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="mb-3 text-sm font-semibold text-slate-600" aria-live="polite">
            {t("browse.showing", { count: 0, total })}
          </p>
          <h2 className="text-xl font-bold text-slate-950">
            {t("browse.emptyTitle")}
          </h2>
          <p className="mt-2 text-slate-600">{t("browse.emptyText")}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to="/check"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-800 px-5 font-bold text-white hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              {t("browse.tryWizard")}
            </Link>
            <a
              href="https://www.myscheme.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-800 px-5 font-bold text-teal-900 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              {t("browse.myscheme")}
              <span className="sr-only">{t("accessibility.opensNewTab")}</span>
            </a>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm font-semibold text-slate-600" aria-live="polite">
            {t("browse.showing", { count: schemes.length, total })}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schemes.map((scheme, index) => (
              <SchemeCard
                key={scheme?.slug || `${scheme?.name || "scheme"}-${index}`}
                scheme={scheme}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <nav
              aria-label={t("accessibility.schemePagination")}
              className="mt-8 flex flex-wrap items-center justify-center gap-2"
            >
              <button
                type="button"
                onClick={() => updatePage(Math.max(1, page - 1))}
                disabled={page <= 1 || query.isFetching}
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              >
                {t("browse.previous")}
              </button>
              {pageNumbers.map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    aria-label={t("browse.goToPage", { page: pageNumber })}
                    aria-current={pageNumber === page ? "page" : undefined}
                    onClick={() => updatePage(pageNumber)}
                    disabled={query.isFetching}
                    className={`min-h-11 min-w-11 rounded-xl border px-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50 ${
                      pageNumber === page
                        ? "border-teal-800 bg-teal-800 text-white"
                        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => updatePage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || query.isFetching}
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              >
                {t("browse.next")}
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}

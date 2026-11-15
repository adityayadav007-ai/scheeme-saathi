import { useDeferredValue, useState } from "react";
import { useTranslation } from "react-i18next";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import PageMeta from "../components/PageMeta.jsx";
import RequestError from "../components/RequestError.jsx";
import SchemeCard from "../components/SchemeCard.jsx";
import { useSchemes } from "../hooks/useSchemes.js";

export default function BrowseSchemesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim());
  const params = {
    ...(deferredSearch ? { q: deferredSearch } : {}),
    ...(category ? { category } : {}),
    page,
    limit: 12
  };
  const query = useSchemes(params);
  const totalPages = Math.max(query.data?.pagination.totalPages ?? 1, 1);

  function updateSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function updateCategory(value) {
    setCategory(value);
    setPage(1);
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

      <div className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          <label htmlFor="browse-search" className="sr-only">
            {t("browse.search")}
          </label>
          <input
            id="browse-search"
            type="search"
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder={t("browse.search")}
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          />
        </div>
        <div>
          <label htmlFor="browse-category" className="sr-only">
            {t("browse.category")}
          </label>
          <select
            id="browse-category"
            value={category}
            onChange={(event) => updateCategory(event.target.value)}
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          >
            <option value="">{t("browse.allCategories")}</option>
            {t("categories", { returnObjects: true }).map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>
      </div>

      {query.isLoading || (!query.data && !query.isError) ? (
        <div className="mt-8"><LoadingSkeleton /></div>
      ) : query.isError ? (
        <div className="mt-8">
          <RequestError
            message={t("errors.loadSchemes")}
            onRetry={() => query.refetch()}
          />
        </div>
      ) : query.data.data.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-xl font-bold">{t("browse.emptyTitle")}</h2>
          <p className="mt-2 text-slate-600">{t("browse.emptyText")}</p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {query.data.data.map((scheme) => (
              <SchemeCard key={scheme.slug} scheme={scheme} />
            ))}
          </div>
          <nav
            aria-label={t("accessibility.schemePagination")}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || query.isFetching}
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold disabled:opacity-50"
            >
              {t("browse.previous")}
            </button>
            <span className="text-sm font-semibold text-slate-700">
              {t("browse.page")} {page} {t("browse.of")} {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages || query.isFetching}
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold disabled:opacity-50"
            >
              {t("browse.next")}
            </button>
          </nav>
        </>
      )}
    </section>
  );
}

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageMeta from "../components/PageMeta.jsx";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <PageMeta
        title={t("seo.notFoundTitle")}
        description={t("seo.notFoundDescription")}
      />
      <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-800">
        {t("notFound.code")}
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {t("notFound.title")}
      </h1>
      <p className="mt-3 leading-6 text-slate-600">{t("notFound.text")}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="inline-flex min-h-12 items-center rounded-xl bg-teal-800 px-5 font-bold text-white hover:bg-teal-900"
        >
          {t("notFound.home")}
        </Link>
        <Link
          to="/schemes"
          className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-5 font-bold text-slate-800 hover:bg-slate-50"
        >
          {t("notFound.browse")}
        </Link>
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageMeta from "../components/PageMeta.jsx";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div>
      <PageMeta
        title={t("seo.homeTitle")}
        description={t("seo.homeDescription")}
      />
      <section className="overflow-hidden bg-[#073f3c] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-200">
              {t("home.eyebrow")}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {t("home.title")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-teal-50">
              {t("home.intro")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/check"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#f7be55] px-6 text-base font-extrabold text-slate-950 shadow-sm transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {t("home.check")}
              </Link>
              <Link
                to="/schemes"
                className="inline-flex min-h-12 items-center rounded-xl px-4 font-bold text-white underline decoration-teal-300 underline-offset-4 hover:decoration-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {t("home.browse")}
              </Link>
            </div>
          </div>
          <aside className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <div
              aria-hidden="true"
              className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f7be55] text-xl font-black text-slate-950"
            >
              ✓
            </div>
            <h2 className="mt-5 text-xl font-bold">{t("home.trustTitle")}</h2>
            <p className="mt-3 leading-7 text-teal-50">
              {t("home.trustText")}
            </p>
          </aside>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {t("home.steps", { returnObjects: true }).map((item, index) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-xs font-black uppercase tracking-widest text-teal-800">
                0{index + 1}
              </p>
              <h2 className="mt-3 text-lg font-bold text-slate-900">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

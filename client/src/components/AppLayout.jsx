import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageToggle from "./LanguageToggle.jsx";

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-teal-50 text-teal-900"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

export default function AppLayout({ children }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf9] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-x-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg text-lg font-extrabold tracking-tight text-teal-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-lg bg-teal-800 text-sm font-black text-white"
            >
              S
            </span>
            {t("brand")}
          </Link>
          <div className="flex min-h-14 items-center">
            <LanguageToggle />
          </div>
          <nav
            aria-label={t("accessibility.mainNavigation")}
            className="order-last flex w-full items-center justify-center gap-1 border-t border-slate-100 py-1 md:order-none md:w-auto md:border-0 md:py-0"
          >
            <NavLink to="/" end className={navClass}>
              {t("nav.home")}
            </NavLink>
            <NavLink to="/schemes" className={navClass}>
              <span className="hidden sm:inline">{t("nav.browse")}</span>
              <span className="sm:hidden">{t("nav.browseShort")}</span>
            </NavLink>
            <NavLink to="/check" className={navClass}>
              <span className="hidden sm:inline">{t("nav.check")}</span>
              <span className="sm:hidden">{t("nav.checkShort")}</span>
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="w-full flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm leading-6 text-slate-600 sm:px-6 lg:px-8">
          <p>{t("disclaimer")}</p>
        </div>
      </footer>
    </div>
  );
}

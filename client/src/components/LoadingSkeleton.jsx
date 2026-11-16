import { useTranslation } from "react-i18next";

export default function LoadingSkeleton({ count = 3, grid = false }) {
  const { t } = useTranslation();

  return (
    <div
      className={grid ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}
      aria-label={t("accessibility.loadingSchemes")}
      aria-live="polite"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="h-5 w-2/3 rounded bg-slate-200" />
          <div className="mt-4 h-3 w-1/3 rounded bg-slate-100" />
          <div className="mt-6 h-3 w-full rounded bg-slate-100" />
          <div className="mt-2 h-3 w-5/6 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

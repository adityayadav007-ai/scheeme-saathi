import { useTranslation } from "react-i18next";

export default function RequestError({ message, onRetry }) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-950"
    >
      <p className="font-semibold">{message || t("errors.generic")}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-red-300 bg-white px-4 text-sm font-bold hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          {t("results.retry")}
        </button>
      )}
    </div>
  );
}

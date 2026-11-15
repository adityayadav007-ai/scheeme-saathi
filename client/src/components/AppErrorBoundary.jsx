import { Component } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Scheme Saathi UI error:", {
      error,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return this.props.fallback;
  }
}

function ErrorFallback() {
  const { t } = useTranslation();

  return (
    <section
      role="alert"
      className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6"
    >
      <h1 className="text-3xl font-black text-slate-950">
        {t("errorBoundary.title")}
      </h1>
      <p className="mt-3 leading-6 text-slate-600">
        {t("errorBoundary.text")}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-11 rounded-xl border border-slate-300 px-4 font-bold text-slate-800"
        >
          {t("errorBoundary.reload")}
        </button>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-xl bg-teal-800 px-4 font-bold text-white"
        >
          {t("errorBoundary.home")}
        </Link>
      </div>
    </section>
  );
}

export default function AppErrorBoundary({ children }) {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>{children}</ErrorBoundary>
  );
}

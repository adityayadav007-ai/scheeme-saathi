import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppErrorBoundary from "./components/AppErrorBoundary.jsx";
import AppLayout from "./components/AppLayout.jsx";

const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const EligibilityWizardPage = lazy(
  () => import("./pages/EligibilityWizardPage.jsx")
);
const ResultsPage = lazy(() => import("./pages/ResultsPage.jsx"));
const BrowseSchemesPage = lazy(() => import("./pages/BrowseSchemesPage.jsx"));
const SchemeDetailPage = lazy(() => import("./pages/SchemeDetailPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 4_000),
      refetchOnWindowFocus: false
    },
    mutations: { retry: 1 }
  }
});

export default function App() {
  const { t } = useTranslation();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AppLayout>
          <AppErrorBoundary>
            <Suspense
              fallback={
                <div
                  className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-600"
                  aria-live="polite"
                >
                  {t("accessibility.loadingSchemes")}
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/check" element={<EligibilityWizardPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/schemes" element={<BrowseSchemesPage />} />
                <Route path="/scheme/:slug" element={<SchemeDetailPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </AppErrorBoundary>
        </AppLayout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

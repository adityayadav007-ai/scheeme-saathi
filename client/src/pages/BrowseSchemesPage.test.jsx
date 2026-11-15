import { cleanup, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../i18n/index.js";
import BrowseSchemesPage from "./BrowseSchemesPage.jsx";

const { useSchemesMock } = vi.hoisted(() => ({
  useSchemesMock: vi.fn()
}));

vi.mock("../hooks/useSchemes.js", () => ({
  useSchemes: useSchemesMock
}));

const scheme = {
  name: "Example scheme",
  slug: "example-scheme",
  category: "Education",
  verified: true,
  officialLink: "https://example.gov.in",
  lastSyncedAt: null
};

function renderBrowsePage() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <BrowseSchemesPage />
      </MemoryRouter>
    </HelmetProvider>
  );
}

function loadedQuery(data) {
  return {
    data,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn()
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("browse schemes response handling", () => {
  test("shows the empty state when the API returns no schemes", () => {
    useSchemesMock.mockReturnValue(
      loadedQuery({
        data: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0 }
      })
    );

    renderBrowsePage();

    expect(screen.getByText("No schemes found yet")).toBeTruthy();
  });

  test("shows the empty state when the response has no data array", () => {
    useSchemesMock.mockReturnValue(loadedQuery({}));

    renderBrowsePage();

    expect(screen.getByText("No schemes found yet")).toBeTruthy();
  });

  test("uses a safe one-page fallback when pagination is missing", () => {
    useSchemesMock.mockReturnValue(loadedQuery({ data: [scheme] }));

    renderBrowsePage();

    expect(screen.getByRole("link", { name: "Example scheme" })).toBeTruthy();
    expect(screen.getByText("Page 1 of 1")).toBeTruthy();
  });

  test("renders schemes and pagination from a normal API response", () => {
    useSchemesMock.mockReturnValue(
      loadedQuery({
        data: [scheme],
        pagination: { page: 1, limit: 12, total: 25, totalPages: 3 }
      })
    );

    renderBrowsePage();

    expect(screen.getByRole("link", { name: "Example scheme" })).toBeTruthy();
    expect(screen.getByText("Page 1 of 3")).toBeTruthy();
  });
});

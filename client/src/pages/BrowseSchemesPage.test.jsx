import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, useLocation } from "react-router-dom";
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

function CurrentSearch() {
  const location = useLocation();
  return <output data-testid="current-search">{location.search}</output>;
}

function renderBrowsePage(initialEntry = "/schemes") {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <BrowseSchemesPage />
        <CurrentSearch />
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
  vi.useRealTimers();
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

    expect(screen.getByText("No schemes found")).toBeTruthy();
    expect(screen.getByText("Showing 0 of 0 schemes")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Check eligibility" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /myScheme\.gov\.in/ })
    ).toBeTruthy();
  });

  test("shows a clear loading message while schemes are loading", () => {
    useSchemesMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isFetching: true,
      refetch: vi.fn()
    });

    renderBrowsePage();

    expect(screen.getByText("Loading schemes")).toBeTruthy();
  });

  test("shows the empty state when the response has no data array", () => {
    useSchemesMock.mockReturnValue(loadedQuery({}));

    renderBrowsePage();

    expect(screen.getByText("No schemes found")).toBeTruthy();
  });

  test("does not render pagination when the pagination object is missing", () => {
    useSchemesMock.mockReturnValue(loadedQuery({ data: [scheme] }));

    renderBrowsePage();

    expect(screen.getByRole("link", { name: "Example scheme" })).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Scheme pages" })).toBeNull();
    expect(screen.getByText("Showing 1 of 0 schemes")).toBeTruthy();
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
    expect(screen.getByRole("button", { name: "Go to page 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Go to page 3" })).toBeTruthy();
    expect(screen.getByText("Showing 1 of 25 schemes")).toBeTruthy();
  });

  test("debounces search and updates the URL while resetting the page", async () => {
    vi.useFakeTimers();
    useSchemesMock.mockReturnValue(
      loadedQuery({
        data: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0 }
      })
    );

    renderBrowsePage("/schemes?page=2");
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: " farmer " }
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId("current-search").textContent).toBe("?q=farmer");
  });
});

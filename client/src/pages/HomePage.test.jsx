import { cleanup, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, test, vi } from "vitest";
import i18n from "../i18n/index.js";
import HomePage from "./HomePage.jsx";

const { useSchemesMock } = vi.hoisted(() => ({
  useSchemesMock: vi.fn()
}));

vi.mock("../hooks/useSchemes.js", () => ({
  useSchemes: useSchemesMock
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("home popular schemes", () => {
  test("loads popular schemes and links to the full directory", async () => {
    await i18n.changeLanguage("en");
    useSchemesMock.mockReturnValue({
      data: {
        data: [
          {
            name: "Popular scheme",
            slug: "popular-scheme",
            verified: true,
            officialLink: "https://service.gov.in"
          }
        ]
      },
      isLoading: false,
      isError: false
    });

    render(
      <HelmetProvider>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <HomePage />
          </MemoryRouter>
        </I18nextProvider>
      </HelmetProvider>
    );

    expect(await screen.findByText("Popular schemes")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Popular scheme" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Browse all schemes" }).length)
      .toBeGreaterThan(0);
    expect(useSchemesMock).toHaveBeenCalledWith(
      { page: 1, limit: 6 },
      { staleTime: 300000 }
    );
  });
});

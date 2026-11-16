import { cleanup, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { I18nextProvider } from "react-i18next";
import { afterEach, describe, expect, test, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import i18n from "../i18n/index.js";
import SchemeDetailPage from "./SchemeDetailPage.jsx";

const { useSchemeMock } = vi.hoisted(() => ({
  useSchemeMock: vi.fn()
}));

vi.mock("../hooks/useSchemes.js", () => ({
  useScheme: useSchemeMock
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderDetail(initialEntry = "/scheme/example-scheme") {
  return render(
    <HelmetProvider>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/scheme/:slug" element={<SchemeDetailPage />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </HelmetProvider>
  );
}

describe("scheme detail", () => {
  test("shows structured eligibility and safely opens the official site", async () => {
    await i18n.changeLanguage("en");
    useSchemeMock.mockReturnValue({
      data: {
        name: "Education support",
        slug: "education-support",
        ministry: "Education Department",
        category: "Education",
        level: "Central",
        description: "Description",
        benefits: "Benefit details",
        eligibilityText: "Applicants must meet the criteria.",
        eligibility: {
          minAge: 18,
          maxAge: 30,
          gender: ["female"],
          category: ["SC"],
          occupation: ["student"],
          maxIncome: 100000,
          area: ["Rural"],
          requiresLand: null,
          requiresBPL: false
        },
        documents: ["Identity proof"],
        howToApply: "Apply online.",
        officialLink: "https://education.gov.in/scheme",
        sourceUrl: "https://education.gov.in/source",
        verified: false,
        needsReview: true,
        lastSyncedAt: "2026-01-02T00:00:00.000Z"
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn()
    });

    renderDetail({
      pathname: "/scheme/education-support",
      state: { returnTo: "/schemes?q=education&page=2" }
    });

    expect(screen.getByText("This information is not yet verified.")).toBeTruthy();
    expect(screen.getByText("18 to 30 years")).toBeTruthy();
    expect(screen.getByText("Up to ₹1,00,000")).toBeTruthy();
    expect(screen.getByText("student")).toBeTruthy();
    expect(screen.getByText("Identity proof")).toBeTruthy();
    const officialLinks = screen.getAllByRole("link", {
      name: "Open the official website for Education support in a new tab"
    });
    expect(officialLinks).toHaveLength(2);
    expect(officialLinks[0].getAttribute("target")).toBe("_blank");
    expect(officialLinks[0].getAttribute("rel")).toBe("noopener noreferrer");
    expect(
      screen.getByRole("link", { name: "Back to schemes" }).getAttribute("href")
    ).toBe("/schemes?q=education&page=2");
  });

  test("shows a friendly not-found state for a missing scheme", async () => {
    await i18n.changeLanguage("en");
    useSchemeMock.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: { response: { status: 404 } },
      refetch: vi.fn()
    });

    renderDetail();

    expect(await screen.findByText("We couldn't find that scheme.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Browse schemes" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Return home" })).toBeTruthy();
  });
});

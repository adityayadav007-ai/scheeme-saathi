import { cleanup, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { afterEach, describe, expect, test } from "vitest";
import { MemoryRouter } from "react-router-dom";
import i18n from "../i18n/index.js";
import SchemeCard from "./SchemeCard.jsx";

afterEach(cleanup);

function renderCard(scheme) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/schemes?q=farmer&page=2"]}>
        <SchemeCard scheme={scheme} />
      </MemoryRouter>
    </I18nextProvider>
  );
}

describe("scheme cards", () => {
  test("shows scheme details, badges and safe official link", async () => {
    await i18n.changeLanguage("en");
    renderCard({
      name: "Example farmer scheme",
      slug: "example-farmer-scheme",
      ministry: "Agriculture Department",
      category: "Agriculture",
      level: "Central",
      description: "A useful scheme description.",
      benefits: "Direct support. Check the current rules.",
      verified: true,
      officialLink: "https://agriculture.gov.in/scheme",
      lastSyncedAt: null
    });

    expect(screen.getByText(/Agriculture Department/)).toBeTruthy();
    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.getByText("Direct support.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Example farmer scheme" })).toBeTruthy();
    expect(
      screen.getByRole("link", {
        name: "View details for Example farmer scheme"
      })
    ).toBeTruthy();
    const officialLink = screen.getByRole("link", {
      name: "Open the official website for Example farmer scheme in a new tab"
    });
    expect(officialLink.getAttribute("href")).toBe(
      "https://agriculture.gov.in/scheme"
    );
    expect(officialLink.getAttribute("target")).toBe("_blank");
    expect(officialLink.getAttribute("rel")).toBe("noopener noreferrer");
  });

  test("renders safely when optional scheme fields are missing", async () => {
    await i18n.changeLanguage("en");
    renderCard({});

    expect(screen.getByText("Scheme details")).toBeTruthy();
    expect(screen.getByText("Unverified data")).toBeTruthy();
    expect(screen.getByText("Link not available")).toBeTruthy();
  });

  test.each([
    "http://service.gov.in/scheme",
    "javascript:alert(1)",
    "https://example.com/scheme"
  ])("hides the official website button for unsafe URL %s", async (officialLink) => {
    await i18n.changeLanguage("en");
    renderCard({
      name: "Unsafe scheme",
      slug: "unsafe-scheme",
      officialLink
    });

    expect(
      screen.queryByRole("link", { name: /open the official website/i })
    ).toBeNull();
    expect(screen.getByText("Link not available")).toBeTruthy();
  });
});

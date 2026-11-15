import { cleanup, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { afterEach, describe, expect, test } from "vitest";
import i18n from "../i18n/index.js";
import SchemeSourceFooter from "./SchemeSourceFooter.jsx";

afterEach(cleanup);

function renderFooter(verified) {
  return render(
    <I18nextProvider i18n={i18n}>
      <SchemeSourceFooter
        scheme={{
          verified,
          needsReview: !verified,
          officialLink: "https://example.gov.in/",
          sourceUrl: null,
          linkStatus: "ok",
          lastSyncedAt: null
        }}
      />
    </I18nextProvider>
  );
}

describe("scheme verification status", () => {
  test("shows the verified badge for verified schemes", async () => {
    await i18n.changeLanguage("en");
    renderFooter(true);

    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.queryByText("Unverified data")).toBeNull();
  });

  test("shows the unverified badge for schemes awaiting review", async () => {
    await i18n.changeLanguage("en");
    renderFooter(false);

    expect(screen.getByText("Unverified data")).toBeTruthy();
    expect(screen.queryByText("Verified")).toBeNull();
  });
});

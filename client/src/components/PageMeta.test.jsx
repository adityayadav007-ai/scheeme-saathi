import { cleanup, render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { afterEach, describe, expect, test } from "vitest";
import PageMeta from "./PageMeta.jsx";

afterEach(cleanup);

describe("page metadata", () => {
  test("sets the page title, description, and Open Graph metadata", async () => {
    render(
      <HelmetProvider>
        <PageMeta title="Test page" description="Test description" />
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(document.title).toBe("Test page");
      expect(
        document.querySelector('meta[property="og:description"]')?.content
      ).toBe("Test description");
    });
  });
});

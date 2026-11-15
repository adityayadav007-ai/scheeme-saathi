import { describe, expect, test } from "vitest";
import { normalizeApiBaseUrl } from "./apiBaseUrl.js";

describe("normalizeApiBaseUrl", () => {
  test.each([
    ["https://x.com", "https://x.com/api"],
    ["https://x.com/", "https://x.com/api"],
    ["https://x.com/api", "https://x.com/api"],
    ["https://x.com/api/", "https://x.com/api"]
  ])("normalizes %s to %s", (value, expected) => {
    expect(normalizeApiBaseUrl(value, false)).toBe(expected);
  });

  test("trims spaces and repeated API suffixes", () => {
    expect(normalizeApiBaseUrl("  https://x.com/api/api///  ", false)).toBe(
      "https://x.com/api"
    );
  });

  test("uses the local server host when development configuration is empty", () => {
    expect(normalizeApiBaseUrl("  ", true)).toBe(
      "http://127.0.0.1:5000/api"
    );
  });
});

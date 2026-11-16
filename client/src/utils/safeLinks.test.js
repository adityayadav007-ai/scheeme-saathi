import { describe, expect, test } from "vitest";
import { getSafeGovUrl, isSafeGovLink } from "./safeLinks.js";

describe("government URL safety", () => {
  test.each([
    ["https://service.gov.in/scheme", true],
    ["https://data.nic.in/dataset", true],
    ["http://service.gov.in/scheme", false],
    ["javascript:alert(1)", false],
    ["https://example.com/scheme", false],
    ["https://service.gov.in.attacker.example/scheme", false],
    ["", false],
    [null, false]
  ])("validates %s", (value, expected) => {
    expect(isSafeGovLink(value)).toBe(expected);
  });

  test("returns a normalized URL only when it is safe", () => {
    expect(getSafeGovUrl(" https://service.gov.in/path ")).toBe(
      "https://service.gov.in/path"
    );
    expect(getSafeGovUrl("https://example.com")).toBeNull();
  });
});

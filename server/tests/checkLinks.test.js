import { afterEach, describe, expect, test, vi } from "vitest";
import { checkAllLinks, checkOfficialLink } from "../jobs/checkLinks.js";

afterEach(() => {
  vi.restoreAllMocks();
});

function httpClientFor(status) {
  return {
    head: vi.fn().mockResolvedValue({ status }),
    get: vi.fn()
  };
}

describe("checkOfficialLink", () => {
  test("marks a successful response as ok and uses the configured timeout", async () => {
    const httpClient = httpClientFor(200);
    const status = await checkOfficialLink("https://example.gov.in", {
      httpClient,
      delayMs: 0
    });

    expect(status).toBe("ok");
    expect(httpClient.head).toHaveBeenCalledWith(
      "https://example.gov.in",
      expect.objectContaining({ timeout: 10_000 })
    );
    expect(httpClient.get).not.toHaveBeenCalled();
  });

  test.each([404, 410])("marks HTTP %i as broken", async (statusCode) => {
    const status = await checkOfficialLink("https://example.gov.in", {
      httpClient: httpClientFor(statusCode),
      delayMs: 0
    });
    expect(status).toBe("broken");
  });

  test("marks a server error as broken", async () => {
    const status = await checkOfficialLink("https://example.gov.in", {
      httpClient: httpClientFor(500),
      delayMs: 0
    });
    expect(status).toBe("broken");
  });

  test.each([403, 429])("treats HTTP %i as unknown", async (statusCode) => {
    const httpClient = httpClientFor(statusCode);
    const status = await checkOfficialLink("https://example.gov.in", {
      httpClient,
      delayMs: 0
    });
    expect(status).toBe("unknown");
    expect(httpClient.get).not.toHaveBeenCalled();
  });

  test("falls back to GET when HEAD is not supported", async () => {
    const httpClient = httpClientFor(405);
    httpClient.get.mockResolvedValue({ status: 200 });

    const status = await checkOfficialLink("https://example.gov.in", {
      httpClient,
      delayMs: 0
    });

    expect(status).toBe("ok");
    expect(httpClient.get).toHaveBeenCalledOnce();
  });

  test("marks network failures and timeouts as broken", async () => {
    const httpClient = {
      head: vi.fn().mockRejectedValue(new Error("timeout")),
      get: vi.fn()
    };
    const status = await checkOfficialLink("https://example.gov.in", {
      httpClient,
      delayMs: 0
    });
    expect(status).toBe("broken");
  });
});

test("persists status and never clears needsReview after a working link check", async () => {
  const schemes = [
    { _id: "working", officialLink: "https://example.gov.in/working" },
    { _id: "broken", officialLink: "https://example.gov.in/broken" },
    { _id: "blocked", officialLink: "https://example.gov.in/blocked" }
  ];
  const findQuery = { lean: vi.fn().mockResolvedValue(schemes) };
  const schemeModel = {
    find: vi.fn().mockReturnValue(findQuery),
    updateOne: vi.fn().mockResolvedValue({})
  };
  const httpClient = {
    head: vi.fn(async (url) => ({
      status: url.endsWith("/working")
        ? 200
        : url.endsWith("/broken")
          ? 404
          : 403
    })),
    get: vi.fn()
  };
  const checkedAt = new Date("2026-01-01T00:00:00.000Z");
  vi.spyOn(console, "log").mockImplementation(() => {});

  const summary = await checkAllLinks({
    schemeModel,
    httpClient,
    concurrency: 9,
    delayMs: 0,
    now: () => checkedAt
  });

  expect(summary).toEqual({ ok: 1, broken: 1, unknown: 1 });
  expect(schemeModel.updateOne).toHaveBeenCalledTimes(3);
  const updates = Object.fromEntries(
    schemeModel.updateOne.mock.calls.map(([filter, update]) => [
      filter._id,
      update.$set
    ])
  );
  expect(updates.working).toEqual({
    linkStatus: "ok",
    linkCheckedAt: checkedAt
  });
  expect(updates.working).not.toHaveProperty("needsReview");
  expect(updates.broken).toEqual({
    linkStatus: "broken",
    linkCheckedAt: checkedAt,
    needsReview: true
  });
  expect(updates.blocked.linkStatus).toBe("unknown");
  expect(updates.blocked).not.toHaveProperty("needsReview");
});

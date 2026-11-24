import { afterEach, describe, expect, test, vi } from "vitest";

const { client, create } = vi.hoisted(() => {
  const instance = {
    get: vi.fn(),
    post: vi.fn()
  };
  return {
    client: instance,
    create: vi.fn(() => instance)
  };
});

vi.mock("axios", () => ({
  default: { create }
}));

import { getScheme, getSchemes, matchSchemes } from "./api.js";

afterEach(() => {
  vi.clearAllMocks();
});

describe("API service response defaults", () => {
  test("normalizes a normal paginated schemes response", async () => {
    const schemes = [{ name: "Example", slug: "example" }];
    client.get.mockResolvedValueOnce({
      data: {
        data: schemes,
        pagination: { page: 2, limit: 12, total: 25, totalPages: 3 }
      }
    });

    await expect(getSchemes({ page: 2 })).resolves.toEqual({
      data: schemes,
      pagination: { page: 2, limit: 12, total: 25, totalPages: 3 }
    });
    expect(client.get).toHaveBeenCalledWith("/schemes", {
      params: { page: 2 }
    });
  });

  test("returns empty data and safe pagination when fields are missing", async () => {
    client.get.mockResolvedValueOnce({ data: {} });

    await expect(getSchemes()).resolves.toEqual({
      data: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 1 }
    });
  });

  test("fills missing fields in a partial pagination object", async () => {
    client.get.mockResolvedValueOnce({
      data: { data: [], pagination: { page: 3 } }
    });

    await expect(getSchemes()).resolves.toEqual({
      data: [],
      pagination: { page: 3, limit: 12, total: 0, totalPages: 1 }
    });
  });

  test("returns null for a missing scheme payload", async () => {
    client.get.mockResolvedValueOnce({ data: {} });

    await expect(getScheme("scheme name", "hi")).resolves.toBeNull();
    expect(client.get).toHaveBeenCalledWith("/schemes/scheme%20name", {
      params: { lang: "hi" }
    });
  });

  test("returns safe match arrays when the payload is incomplete", async () => {
    client.post.mockResolvedValueOnce({ data: {} });

    await expect(matchSchemes({ age: 30 })).resolves.toEqual({
      eligible: [],
      partial: []
    });
  });
});

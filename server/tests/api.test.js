import request from "supertest";
import { afterEach, describe, expect, test, vi } from "vitest";
import app, { createCorsOriginCallback } from "../app.js";
import Scheme from "../models/Scheme.js";

afterEach(() => {
  vi.restoreAllMocks();
});

function queryChain(result) {
  const chain = {
    sort: vi.fn(() => chain),
    skip: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    lean: vi.fn().mockResolvedValue(result)
  };
  return chain;
}

describe("scheme API", () => {
  test("allows local development origins on changing ports", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5176");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5176"
    );
  });

  test("keeps configured origins exact in production", () => {
    const logBlockedOrigin = vi.fn();
    const originCallback = createCorsOriginCallback({
      origins: [" https://client.example/ ", "https://admin.example"],
      production: true,
      logBlockedOrigin
    });
    const checkOrigin = (origin) =>
      new Promise((resolve, reject) => {
        originCallback(origin, (error, allowed) => {
          if (error) reject(error);
          else resolve(allowed);
        });
      });

    return Promise.all([
      checkOrigin("https://client.example"),
      checkOrigin("http://localhost:5176"),
      checkOrigin(undefined)
    ]).then(([configured, local, noOrigin]) => {
      expect(configured).toBe(true);
      expect(local).toBe(false);
      expect(noOrigin).toBe(true);
      expect(logBlockedOrigin).toHaveBeenCalledWith("http://localhost:5176");
    });
  });

  test("adds CORS headers to API validation errors", async () => {
    const response = await request(app)
      .get("/api/schemes?state=NotAState")
      .set("Origin", "http://127.0.0.1:5175");

    expect(response.status).toBe(400);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://127.0.0.1:5175"
    );
  });

  test("sets security headers and only allows the configured client origin", async () => {
    const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
    const response = await request(app)
      .get("/api/health")
      .set("Origin", origin);

    expect(response.status).toBe(200);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["access-control-allow-origin"]).toBe(origin);
  });

  test("lists schemes with pagination metadata and a state-aware filter", async () => {
    const scheme = { name: "Example", state: "All" };
    const find = vi.spyOn(Scheme, "find").mockReturnValue(queryChain([scheme]));
    vi.spyOn(Scheme, "countDocuments").mockResolvedValue(1);

    const response = await request(app)
      .get("/api/schemes")
      .query({ state: "Maharashtra", page: "2", limit: "5" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [scheme],
      pagination: { page: 2, limit: 5, total: 1, totalPages: 1 }
    });
    expect(find).toHaveBeenCalledWith({
      state: { $in: ["Maharashtra", "All"] }
    });
  });

  test("escapes search text and rejects invalid list parameters", async () => {
    const find = vi.spyOn(Scheme, "find").mockReturnValue(queryChain([]));
    vi.spyOn(Scheme, "countDocuments").mockResolvedValue(0);

    const response = await request(app).get("/api/schemes?q=.*");
    expect(response.status).toBe(200);
    expect(find.mock.calls[0][0].$or[0].name.$regex).toBe("\\.\\*");

    const invalid = await request(app).get("/api/schemes?state=NotAState");
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.message).toBe("Request validation failed");
  });

  test("returns one scheme by slug and a clear 404 for an unknown slug", async () => {
    const findOne = vi.spyOn(Scheme, "findOne");
    findOne.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue({ name: "Example", slug: "example" })
    });
    findOne.mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(null) });

    const found = await request(app).get("/api/schemes/example");
    expect(found.status).toBe(200);
    expect(found.body.data.slug).toBe("example");

    const missing = await request(app).get("/api/schemes/not-found");
    expect(missing.status).toBe(404);
    expect(missing.body.error.message).toContain('Scheme "not-found" was not found');
  });

  test("matches without persisting answers and validates the request body", async () => {
    const find = vi.spyOn(Scheme, "find").mockReturnValue(
      queryChain([
        {
          name: "Example",
          state: "All",
          verified: true,
          needsReview: false,
          eligibility: {
            minAge: 18,
            maxAge: 60,
            gender: ["female"],
            category: ["OBC"],
            occupation: ["farmer"],
            maxIncome: 200_000
          }
        }
      ])
    );

    const response = await request(app).post("/api/match").send({
      age: 35,
      gender: "female",
      state: "Maharashtra",
      category: "OBC",
      occupation: "farmer",
      income: 100_000
    });

    expect(response.status).toBe(200);
    expect(response.body.eligible).toHaveLength(1);
    expect(find).toHaveBeenCalledTimes(1);

    const invalid = await request(app)
      .post("/api/match")
      .send({ age: 121, income: -1 });
    expect(invalid.status).toBe(400);
  });

  test("does not write match requests to the access log", async () => {
    vi.spyOn(Scheme, "find").mockReturnValue(queryChain([]));
    const stdoutWrite = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await request(app).post("/api/match").send({ age: 30 });

    expect(stdoutWrite).not.toHaveBeenCalled();
  });
});

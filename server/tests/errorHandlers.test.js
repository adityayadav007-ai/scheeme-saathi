import { afterEach, describe, expect, test, vi } from "vitest";
import { errorHandler } from "../middleware/errorHandlers.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("errorHandler", () => {
  test("does not expose stack traces in production responses", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    errorHandler(new Error("database details"), {}, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: { message: "Internal server error" }
    });
  });

  test("includes stack traces only outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const error = new Error("database details");
    vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandler(error, {}, response, vi.fn());

    expect(response.json).toHaveBeenCalledWith({
      error: { message: "Internal server error", stack: error.stack }
    });
  });
});

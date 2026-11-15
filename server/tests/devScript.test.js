import { EventEmitter } from "node:events";
import { createServer } from "node:net";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  isPortAvailable,
  startDevelopmentServer
} from "../scripts/dev.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("development server startup", () => {
  test("detects a port already occupied on the default listener interface", async () => {
    const server = createServer();
    await new Promise((resolve) => server.listen(0, resolve));
    const { port } = server.address();

    try {
      expect(await isPortAvailable(port)).toBe(false);
    } finally {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  test("does not spawn a duplicate Nodemon when this API is already running", async () => {
    const spawnNodemon = vi.fn();
    const log = vi.fn();

    const result = await startDevelopmentServer({
      port: 5000,
      portAvailable: vi.fn().mockResolvedValue(false),
      schemeSaathiRunning: vi.fn().mockResolvedValue(true),
      spawnNodemon,
      log
    });

    expect(result).toEqual({ status: "already-running" });
    expect(spawnNodemon).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      "Scheme Saathi is already running on port 5000; keeping the existing server."
    );
  });

  test("reports a port conflict when another service owns the port", async () => {
    const reportError = vi.fn();
    const spawnNodemon = vi.fn();

    const result = await startDevelopmentServer({
      port: 5000,
      portAvailable: vi.fn().mockResolvedValue(false),
      schemeSaathiRunning: vi.fn().mockResolvedValue(false),
      spawnNodemon,
      reportError
    });

    expect(result).toEqual({ status: "port-in-use" });
    expect(spawnNodemon).not.toHaveBeenCalled();
    expect(reportError).toHaveBeenCalledWith(
      "Port 5000 is already in use by another process. Stop it or set PORT to an unused port."
    );
  });

  test("starts Nodemon when the configured port is available", async () => {
    const child = new EventEmitter();
    const spawnNodemon = vi.fn(() => child);

    const result = await startDevelopmentServer({
      port: 5001,
      portAvailable: vi.fn().mockResolvedValue(true),
      spawnNodemon
    });

    expect(result).toEqual({ status: "started", child });
    expect(spawnNodemon).toHaveBeenCalledOnce();
  });
});

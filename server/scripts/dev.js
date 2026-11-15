import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDirectory = fileURLToPath(new URL("../", import.meta.url));
const nodemonEntry = path.join(
  serverDirectory,
  "node_modules",
  "nodemon",
  "bin",
  "nodemon.js"
);

export function isPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        resolve(false);
      } else {
        reject(error);
      }
    });
    probe.listen(port, () => {
      probe.close((error) => {
        if (error) reject(error);
        else resolve(true);
      });
    });
  });
}

export async function isSchemeSaathiRunning(port) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
      signal: controller.signal
    });
    if (!response.ok) return false;

    const health = await response.json();
    return health.status === "ok" && health.service === "scheme-saathi-api";
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function startDevelopmentServer({
  port = Number(process.env.PORT) || 5000,
  portAvailable = isPortAvailable,
  schemeSaathiRunning = isSchemeSaathiRunning,
  spawnNodemon = () =>
    spawn(process.execPath, [nodemonEntry, "server.js"], {
      cwd: serverDirectory,
      env: process.env,
      stdio: "inherit"
    }),
  log = console.log,
  reportError = console.error
} = {}) {
  if (!(await portAvailable(port))) {
    if (await schemeSaathiRunning(port)) {
      log(
        `Scheme Saathi is already running on port ${port}; keeping the existing server.`
      );
      return { status: "already-running" };
    }

    reportError(
      `Port ${port} is already in use by another process. Stop it or set PORT to an unused port.`
    );
    return { status: "port-in-use" };
  }

  const child = spawnNodemon();
  child.on("error", (error) => {
    reportError(`Could not start Nodemon: ${error.message}`);
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
  return { status: "started", child };
}

const invokedPath = process.argv[1]
  ? path.resolve(process.argv[1])
  : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = await startDevelopmentServer();
  if (result.status === "port-in-use") process.exitCode = 1;
}

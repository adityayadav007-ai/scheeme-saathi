import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import mongoose from "mongoose";
import { startSyncJob } from "./jobs/syncJob.js";
import { startLinkCheckJob } from "./jobs/linkCheckJob.js";

const port = Number(process.env.PORT) || 5000;

try {
  await connectDatabase();

  const server = app.listen(port);
  const cronTasks = [];

  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received; shutting down gracefully.`);
    cronTasks.forEach((task) => task.stop());

    server.close(async (error) => {
      if (error) {
        console.error(`HTTP server shutdown failed: ${error.message}`);
        process.exitCode = 1;
      }

      try {
        await mongoose.disconnect();
        console.log("MongoDB disconnected");
      } catch (disconnectError) {
        console.error(`MongoDB shutdown failed: ${disconnectError.message}`);
        process.exitCode = 1;
      }
    });
  }

  server.once("listening", () => {
    console.log(`Scheme Saathi API listening on port ${port}`);
    if (process.env.ENABLE_CRON?.toLowerCase() === "true") {
      cronTasks.push(startSyncJob(), startLinkCheckJob());
    } else {
      console.log("Cron jobs disabled. Set ENABLE_CRON=true to enable them.");
    }

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
  });

  server.once("error", async (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `API could not listen on port ${port}: the port is already in use.`
      );
    } else {
      console.error(`API server failed to listen: ${error.message}`);
    }

    cronTasks.forEach((task) => task.stop());
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error(`MongoDB shutdown failed: ${disconnectError.message}`);
    }
    process.exitCode = 1;
  });
} catch (error) {
  console.error(`MongoDB connection failed: ${error.message}`);
  process.exitCode = 1;
}

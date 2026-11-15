import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { syncSources } from "../services/syncService.js";

try {
  await connectDatabase();
  const results = await syncSources();
  if (Object.values(results).some((stats) => stats.failed > 0)) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`Sync failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

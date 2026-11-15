import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { checkAllLinks } from "../jobs/checkLinks.js";

try {
  await connectDatabase();
  await checkAllLinks();
} catch (error) {
  console.error(`Link check failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import Scheme from "../models/Scheme.js";

try {
  await connectDatabase();
  const schemes = await Scheme.find(
    { verified: { $ne: true } },
    "name dataSource linkStatus"
  )
    .sort({ name: 1 })
    .lean();

  console.log(`Unverified schemes: ${schemes.length}`);
  if (schemes.length > 0) {
    console.table(
      schemes.map(({ name, dataSource, linkStatus }) => ({
        name,
        source: dataSource,
        linkStatus
      }))
    );
  }
} catch (error) {
  console.error(`Review list failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

import "dotenv/config";
import mongoose from "mongoose";
import Scheme from "../models/Scheme.js";
import { connectDatabase } from "../config/database.js";

try {
  await connectDatabase();
  const count = await Scheme.countDocuments();
  console.log(`Schemes collection contains ${count} document(s).`);
} catch (error) {
  console.error(`Database check failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

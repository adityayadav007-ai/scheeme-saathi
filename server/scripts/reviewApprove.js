import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import Scheme from "../models/Scheme.js";

const slug = process.argv[2]?.trim();

try {
  if (!slug) {
    throw new Error("Provide a scheme slug: npm run review:approve -- <slug>");
  }

  await connectDatabase();
  const scheme = await Scheme.findOneAndUpdate(
    { slug },
    { $set: { verified: true, needsReview: false } },
    { new: true, runValidators: true }
  )
    .select("name slug verified needsReview")
    .lean();

  if (!scheme) throw new Error(`Scheme "${slug}" was not found.`);
  console.log(`Approved "${scheme.name}" (${scheme.slug}).`);
} catch (error) {
  console.error(`Review approval failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

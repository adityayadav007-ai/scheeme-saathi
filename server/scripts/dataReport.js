import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import Scheme from "../models/Scheme.js";
import { findSimilarSchemeNames } from "../utils/similarSchemeNames.js";

const eligibilityFields = [
  "minAge",
  "maxAge",
  "gender",
  "category",
  "occupation",
  "maxIncome",
  "area",
  "requiresLand",
  "requiresBPL",
  "disability"
];

function isEmpty(value) {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

try {
  await connectDatabase();
  const [total, bySource, byVerified, missingOfficialLink, records] =
    await Promise.all([
      Scheme.countDocuments(),
      Scheme.aggregate([
        { $group: { _id: "$dataSource", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Scheme.aggregate([
        { $group: { _id: "$verified", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Scheme.countDocuments({
        $or: [
          { officialLink: { $exists: false } },
          { officialLink: null },
          { officialLink: "" }
        ]
      }),
      Scheme.find({}, "name slug eligibility").lean()
    ]);

  const emptyEligibilityFields = Object.fromEntries(
    eligibilityFields.map((field) => [
      field,
      records.filter((record) => isEmpty(record.eligibility?.[field])).length
    ])
  );
  const noEligibilityCriteria = records.filter((record) =>
    eligibilityFields.every((field) => isEmpty(record.eligibility?.[field]))
  ).length;
  const similarNames = findSimilarSchemeNames(records);

  console.log(
    JSON.stringify(
      {
        total,
        bySource: Object.fromEntries(
          bySource.map(({ _id, count }) => [_id ?? "unknown", count])
        ),
        byVerified: Object.fromEntries(
          byVerified.map(({ _id, count }) => [
            _id === true ? "verified" : "unverified",
            count
          ])
        ),
        missingOfficialLink,
        emptyEligibilityFields,
        schemesWithNoEligibilityCriteria: noEligibilityCriteria,
        possibleSimilarNamePairs: similarNames.length,
        similarNamePairsForManualReview: similarNames.slice(0, 100)
      },
      null,
      2
    )
  );
  if (similarNames.length > 100) {
    console.log("Only the first 100 possible similar-name pairs are shown.");
  }
} catch (error) {
  console.error(`Data report failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

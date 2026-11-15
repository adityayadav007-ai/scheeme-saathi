import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { slugify } from "../../utils/normalizeSchemeRecord.js";

const seedFile = fileURLToPath(new URL("../../data/seed.json", import.meta.url));

export async function fetchSchemes() {
  const contents = await readFile(seedFile, "utf8");
  const records = JSON.parse(contents);

  if (!Array.isArray(records)) {
    throw new Error("seed.json must contain a JSON array.");
  }

  return records;
}

export function normalize(record) {
  const name = typeof record?.name === "string" ? record.name.trim() : "";
  return {
    ...record,
    name,
    slug: slugify(record?.slug || name),
    dataSource: "seed",
    verified: true,
    needsReview: false,
    lastSyncedAt: new Date()
  };
}

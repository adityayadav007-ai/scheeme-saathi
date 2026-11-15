import Scheme from "../models/Scheme.js";
import { parseEligibility } from "../utils/parseEligibility.js";
import { isValidHttpsUrl, slugify } from "../utils/normalizeSchemeRecord.js";
import * as seedAdapter from "./adapters/seedAdapter.js";
import * as dataGovAdapter from "./adapters/dataGovAdapter.js";
import * as huggingFaceAdapter from "./adapters/huggingFaceAdapter.js";

const sourceAdapters = {
  seed: seedAdapter,
  datagov: dataGovAdapter,
  huggingface: huggingFaceAdapter
};

const sourcePriority = {
  seed: 3,
  datagov: 2,
  huggingface: 1
};

const schemeFields = [
  "name",
  "ministry",
  "level",
  "state",
  "category",
  "description",
  "benefits",
  "eligibilityText",
  "documents",
  "howToApply",
  "officialLink",
  "sourceUrl",
  "note"
];

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

function sourceFieldsFromScheme(scheme) {
  const sourceFields =
    scheme.sourceFields instanceof Map
      ? Object.fromEntries(scheme.sourceFields)
      : { ...(scheme.sourceFields ?? {}) };

  for (const field of schemeFields) {
    if (!sourceFields[field] && !isEmpty(scheme[field])) {
      sourceFields[field] = scheme.dataSource;
    }
  }
  for (const field of eligibilityFields) {
    const key = `eligibility:${field}`;
    if (!sourceFields[key] && !isEmpty(scheme.eligibility?.[field])) {
      sourceFields[key] = scheme.dataSource;
    }
  }

  return sourceFields;
}

function mergeField(existingValue, incomingValue, field, sourceFields, incomingSource) {
  if (isEmpty(incomingValue)) return existingValue;

  const existingSource = sourceFields[field];
  const existingPriority = sourcePriority[existingSource] ?? 0;
  const incomingPriority = sourcePriority[incomingSource] ?? 0;
  if (isEmpty(existingValue) || incomingPriority >= existingPriority) {
    sourceFields[field] = incomingSource;
    return incomingValue;
  }

  return existingValue;
}

export function mergeScheme(existing, incoming) {
  const sourceFields = sourceFieldsFromScheme(existing);
  const incomingSource = incoming.dataSource;
  const merged = {};

  for (const field of schemeFields) {
    merged[field] = mergeField(
      existing[field],
      incoming[field],
      field,
      sourceFields,
      incomingSource
    );
  }

  merged.slug = existing.slug;
  merged.sourceFields = sourceFields;
  merged.dataSource = Object.values(sourceFields).reduce(
    (highest, source) =>
      (sourcePriority[source] ?? 0) > (sourcePriority[highest] ?? 0)
        ? source
        : highest,
    existing.dataSource ?? incomingSource
  );
  merged.verified = Boolean(existing.verified || incoming.verified);
  merged.needsReview = Boolean(existing.needsReview || incoming.needsReview);
  merged.lastSyncedAt = incoming.lastSyncedAt ?? new Date();

  const oldEligibility = existing.eligibility ?? {};
  const newEligibility = incoming.eligibility ?? {};
  const eligibility = {};
  for (const field of eligibilityFields) {
    const key = `eligibility:${field}`;
    eligibility[field] = mergeField(
      oldEligibility[field],
      newEligibility[field],
      key,
      sourceFields,
      incomingSource
    );
  }
  merged.eligibility = eligibility;

  return merged;
}

function withParsedEligibility(scheme) {
  if (!scheme.eligibilityText) return scheme;

  const parsed = parseEligibility(scheme.eligibilityText).eligibility;
  const eligibility = { ...(scheme.eligibility ?? {}) };
  for (const field of eligibilityFields) {
    if (isEmpty(eligibility[field]) && !isEmpty(parsed[field])) {
      eligibility[field] = parsed[field];
    }
  }
  return { ...scheme, eligibility };
}

function validateRecord(record, source) {
  const normalized = withParsedEligibility(
    sourceAdapters[source].normalize(record)
  );
  normalized.name =
    typeof normalized.name === "string" ? normalized.name.trim() : "";

  if (!normalized.name) {
    return { valid: false, reason: "missing name" };
  }

  if (!isValidHttpsUrl(normalized.officialLink, source === "seed")) {
    return { valid: false, reason: "missing or invalid HTTPS official link" };
  }

  normalized.slug = slugify(normalized.slug || normalized.name);
  if (!normalized.slug) {
    return { valid: false, reason: "could not create a scheme slug" };
  }

  normalized.dataSource = source;
  normalized.verified = source === "seed";
  normalized.lastSyncedAt = new Date();
  if (source === "huggingface") normalized.needsReview = true;
  return { valid: true, scheme: normalized };
}

function persistableScheme(scheme) {
  const {
    name,
    slug,
    ministry,
    level,
    state,
    category,
    description,
    benefits,
    eligibilityText,
    eligibility,
    documents,
    howToApply,
    officialLink,
    sourceUrl,
    note,
    dataSource,
    sourceFields,
    verified,
    needsReview,
    lastSyncedAt
  } = scheme;

  return {
    name,
    slug,
    ministry,
    level,
    state,
    category,
    description,
    benefits,
    eligibilityText,
    eligibility,
    documents,
    howToApply,
    officialLink,
    sourceUrl,
    note,
    dataSource,
    sourceFields: sourceFields ?? sourceFieldsFromScheme(scheme),
    verified,
    needsReview,
    lastSyncedAt
  };
}

function newSourceStats() {
  return {
    fetched: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    duplicatesMerged: 0
  };
}

function logSourceStats(source, stats) {
  console.log(
    `${source}: fetched ${stats.fetched}, inserted ${stats.inserted}, updated ${stats.updated}, skipped ${stats.skipped}, failed ${stats.failed}, duplicates merged ${stats.duplicatesMerged}`
  );
}

export function getEnabledSources() {
  const configuredSources = (process.env.ENABLED_SOURCES ?? "seed")
    .split(",")
    .map((source) => source.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(configuredSources)].sort(
    (left, right) =>
      (sourcePriority[right] ?? -1) - (sourcePriority[left] ?? -1)
  );
}

export async function syncSources(requestedSources = getEnabledSources()) {
  const sources = [...new Set(requestedSources.map((source) => source.toLowerCase()))]
    .sort(
      (left, right) =>
        (sourcePriority[right] ?? -1) - (sourcePriority[left] ?? -1)
    );
  const results = {};

  for (const source of sources) {
    const stats = newSourceStats();
    results[source] = stats;
    const adapter = sourceAdapters[source];

    if (!adapter) {
      stats.failed += 1;
      console.error(`Unknown data source "${source}"; skipping it.`);
      logSourceStats(source, stats);
      continue;
    }

    let records;
    try {
      records = await adapter.fetchSchemes();
      stats.fetched = records.length;
    } catch (error) {
      stats.failed += 1;
      console.error(`${source} fetch failed: ${error.message}`);
      logSourceStats(source, stats);
      continue;
    }

    for (const record of records) {
      try {
        const validation = validateRecord(record, source);
        if (!validation.valid) {
          stats.skipped += 1;
          console.warn(`Skipping ${source} record: ${validation.reason}.`);
          continue;
        }

        const incoming = persistableScheme(validation.scheme);
        const existing = await Scheme.findOne({ slug: incoming.slug })
          .select("+sourceFields")
          .lean();
        if (!existing) {
          await Scheme.create(incoming);
          stats.inserted += 1;
          continue;
        }

        await Scheme.updateOne(
          { _id: existing._id },
          { $set: persistableScheme(mergeScheme(existing, incoming)) },
          { runValidators: true }
        );
        stats.updated += 1;
        stats.duplicatesMerged += 1;
      } catch (error) {
        stats.failed += 1;
        console.error(`${source} record failed to save: ${error.message}`);
      }
    }

    logSourceStats(source, stats);
  }

  return results;
}

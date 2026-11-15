const schemeCategories = new Set([
  "Agriculture",
  "Health",
  "Education",
  "Housing",
  "Employment",
  "Women",
  "Senior Citizens",
  "Business",
  "Other"
]);

function normalizedKey(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getMappedValue(record, aliases) {
  if (!Array.isArray(aliases)) return null;

  const keyedRecord = new Map(
    Object.entries(record ?? {}).map(([key, value]) => [normalizedKey(key), value])
  );

  for (const alias of aliases) {
    const value = keyedRecord.get(normalizedKey(alias));
    if (value !== undefined && value !== null && value !== "") return value;

    if (alias.includes(".")) {
      const nestedValue = alias.split(".").reduce((current, key) => {
        if (!current || typeof current !== "object") return undefined;
        const matchingKey = Object.keys(current).find(
          (candidate) => normalizedKey(candidate) === normalizedKey(key)
        );
        return matchingKey === undefined ? undefined : current[matchingKey];
      }, record);
      if (nestedValue !== undefined && nestedValue !== null && nestedValue !== "") {
        return nestedValue;
      }
    }
  }

  return null;
}

function toText(value) {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join("; ") || null;
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value).trim();
  if (!text || /^(?:n\/?a|none|null|unknown|not available|-)$/i.test(text)) {
    return null;
  }
  return text;
}

function toList(value) {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) {
    const values = value.map(toText).filter(Boolean);
    return values.length ? values : null;
  }
  const values = String(value)
    .split(/[;,|]/)
    .map(toText)
    .filter(Boolean);
  return values.length ? values : null;
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const text = String(value).trim().toLowerCase().replace(/,/g, "");
  const number = Number.parseFloat(text.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(number)) return null;
  if (/\b(crore|crores|cr)\b/.test(text)) return number * 10_000_000;
  if (/\b(lakh|lakhs|lac|lacs)\b/.test(text)) return number * 100_000;
  return number;
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === 0) return Boolean(value);
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (["yes", "true", "1", "required"].includes(normalized)) return true;
  if (["no", "false", "0", "not required"].includes(normalized)) return false;
  return null;
}

function toCategory(value) {
  const text = toText(value);
  if (!text) return null;
  return (
    [...schemeCategories].find(
      (category) => category.toLowerCase() === text.toLowerCase()
    ) ?? "Other"
  );
}

export function slugify(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidHttpsUrl(value, governmentOnly = false) {
  if (typeof value !== "string" || !value.trim()) return false;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || !url.hostname.includes(".")) return false;
    if (url.username || url.password) return false;
    if (!governmentOnly) return true;
    return /\.(gov\.in|nic\.in)$/i.test(url.hostname);
  } catch {
    return false;
  }
}

export function normalizeSchemeRecord(record, columnMap, dataSource) {
  const read = (field) => getMappedValue(record, columnMap[field]);
  const readEligibility = (field) =>
    getMappedValue(record?.eligibility ?? record, columnMap.eligibility?.[field]);
  const name = toText(read("name"));
  const rawSlug = toText(read("slug"));
  const rawLevel = toText(read("level"));
  const level =
    rawLevel?.toLowerCase() === "state"
      ? "State"
      : rawLevel?.toLowerCase() === "central"
        ? "Central"
        : null;

  return {
    name,
    slug: rawSlug ? slugify(rawSlug) : slugify(name),
    ministry: toText(read("ministry")),
    level,
    state: toText(read("state")) ?? "All",
    category: toCategory(read("category")),
    description: toText(read("description")),
    benefits: toText(read("benefits")),
    eligibilityText: toText(read("eligibilityText")),
    eligibility: {
      minAge: toNumber(readEligibility("minAge")),
      maxAge: toNumber(readEligibility("maxAge")),
      gender: toList(readEligibility("gender")),
      category: toList(readEligibility("category")),
      occupation: toList(readEligibility("occupation")),
      maxIncome: toNumber(readEligibility("maxIncome")),
      area: toList(readEligibility("area")),
      requiresLand: toBoolean(readEligibility("requiresLand")),
      requiresBPL: toBoolean(readEligibility("requiresBPL")),
      disability: toBoolean(readEligibility("disability"))
    },
    documents: toList(read("documents")),
    howToApply: toText(read("howToApply")),
    officialLink: toText(read("officialLink")),
    sourceUrl: toText(read("sourceUrl")),
    note: toText(read("note")),
    dataSource,
    verified: dataSource === "seed",
    needsReview: dataSource === "huggingface",
    lastSyncedAt: new Date()
  };
}

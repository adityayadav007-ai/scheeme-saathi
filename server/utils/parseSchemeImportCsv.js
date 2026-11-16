import { parse } from "csv-parse/sync";
import { schemeCategories } from "../models/Scheme.js";

export const schemeImportColumns = [
  "name",
  "ministry",
  "level",
  "state",
  "category",
  "description",
  "benefits",
  "eligibilityText",
  "minAge",
  "maxAge",
  "gender",
  "category_eligible",
  "occupation",
  "maxIncome",
  "area",
  "requiresLand",
  "requiresBPL",
  "documents",
  "howToApply",
  "officialLink",
  "sourceUrl",
  "keywords"
];

function makeSlug(name) {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function parseArray(value) {
  const text = value.trim();
  return text ? text.split(";").map((item) => item.trim()).filter(Boolean) : [];
}

function parseNumber(value, field, errors) {
  const text = value.trim();
  if (!text) return null;

  const number = Number(text);
  if (!Number.isFinite(number)) {
    errors.push(`${field} must be a number`);
    return null;
  }
  return number;
}

function parseBoolean(value, field, errors) {
  const text = value.trim().toLowerCase();
  if (!text) return null;
  if (text === "true") return true;
  if (text === "false") return false;
  errors.push(`${field} must be true or false`);
  return null;
}

function nullableText(value) {
  const text = value.trim();
  return text || null;
}

function isValidOfficialLink(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    const officialDomain = ["gov.in", "nic.in"].some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      officialDomain
    );
  } catch {
    return false;
  }
}

function rowValues(record) {
  return Object.fromEntries(
    schemeImportColumns.map((column, index) => [
      column,
      typeof record[index] === "string" ? record[index].trim() : ""
    ])
  );
}

function convertRow(values, errors) {
  const name = values.name;
  const slug = makeSlug(name);
  const minAge = parseNumber(values.minAge, "minAge", errors);
  const maxAge = parseNumber(values.maxAge, "maxAge", errors);
  const maxIncome = parseNumber(values.maxIncome, "maxIncome", errors);
  const requiresLand = parseBoolean(values.requiresLand, "requiresLand", errors);
  const requiresBPL = parseBoolean(values.requiresBPL, "requiresBPL", errors);

  if (!name) errors.push("name is required");
  if (name && !slug) errors.push("name does not produce a usable slug");
  if (!values.officialLink) {
    errors.push("officialLink is required");
  } else if (!isValidOfficialLink(values.officialLink)) {
    errors.push("officialLink must be an HTTPS URL on a .gov.in or .nic.in domain");
  }
  if (!schemeCategories.includes(values.category)) {
    errors.push(`category must be one of: ${schemeCategories.join(", ")}`);
  }
  if (!["Central", "State"].includes(values.level)) {
    errors.push("level must be Central or State");
  }
  if (minAge !== null && maxAge !== null && minAge > maxAge) {
    errors.push("minAge must be less than or equal to maxAge");
  }
  if (maxIncome !== null && maxIncome < 0) {
    errors.push("maxIncome must be at least 0");
  }

  return {
    errors,
    slug,
    scheme: {
      name,
      slug,
      ministry: nullableText(values.ministry),
      level: values.level,
      state: nullableText(values.state) || "All",
      category: values.category,
      description: nullableText(values.description),
      benefits: nullableText(values.benefits),
      eligibilityText: nullableText(values.eligibilityText),
      eligibility: {
        minAge,
        maxAge,
        gender: parseArray(values.gender),
        category: parseArray(values.category_eligible),
        occupation: parseArray(values.occupation),
        maxIncome,
        area: parseArray(values.area),
        requiresLand,
        requiresBPL,
        disability: null
      },
      documents: parseArray(values.documents),
      keywords: parseArray(values.keywords),
      howToApply: nullableText(values.howToApply),
      officialLink: values.officialLink,
      sourceUrl: nullableText(values.sourceUrl)
    }
  };
}

export function parseSchemeImportCsv(content) {
  let records;
  try {
    records = parse(content, {
      bom: true,
      relax_column_count: true,
      skip_empty_lines: true
    });
  } catch (error) {
    const row = Number.isInteger(error.lines) ? error.lines : 1;
    return {
      rowsRead: 0,
      validRows: [],
      skippedRows: [],
      duplicates: [],
      fileErrors: [
        {
          row,
          reason: `CSV parsing failed${error.code ? ` (${error.code})` : ""}`
        }
      ]
    };
  }

  if (records.length === 0) {
    return {
      rowsRead: 0,
      validRows: [],
      skippedRows: [],
      duplicates: [],
      fileErrors: [{ row: 1, reason: "CSV header is missing" }]
    };
  }

  const header = records[0];
  if (
    header.length !== schemeImportColumns.length ||
    header.some((column, index) => column !== schemeImportColumns[index])
  ) {
    return {
      rowsRead: Math.max(records.length - 1, 0),
      validRows: [],
      skippedRows: [],
      duplicates: [],
      fileErrors: [
        {
          row: 1,
          reason: "CSV header must contain the required columns in the exact specified order"
        }
      ]
    };
  }

  const rows = records.slice(1);
  const seenSlugs = new Map();
  const validRows = [];
  const skippedRows = [];
  const duplicates = [];

  rows.forEach((record, index) => {
    const row = index + 2;
    const errors = [];
    if (record.length !== schemeImportColumns.length) {
      errors.push(
        `expected ${schemeImportColumns.length} columns but found ${record.length}`
      );
    }

    const values = rowValues(record);
    const name = values.name;
    const slug = makeSlug(name);
    const firstRow = slug ? seenSlugs.get(slug) : undefined;
    if (slug && firstRow === undefined) seenSlugs.set(slug, row);

    const converted = convertRow(values, errors);
    if (firstRow !== undefined) {
      const duplicate = { row, slug, firstRow };
      duplicates.push(duplicate);
      skippedRows.push({
        row,
        reasons: [
          ...errors,
          `duplicate slug "${slug}" (first seen on row ${duplicate.firstRow})`
        ]
      });
      return;
    }
    if (errors.length > 0) {
      skippedRows.push({ row, reasons: errors });
      return;
    }
    validRows.push({ row, scheme: converted.scheme });
  });

  return {
    rowsRead: rows.length,
    validRows,
    skippedRows,
    duplicates,
    fileErrors: []
  };
}

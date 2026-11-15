import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { HUGGING_FACE_COLUMN_MAP } from "../../config/columnMaps.js";
import { normalizeSchemeRecord } from "../../utils/normalizeSchemeRecord.js";

const serverDirectory = fileURLToPath(new URL("../../", import.meta.url));

function datasetPathFromEnvironment() {
  const datasetPath = process.env.HF_DATASET_PATH?.trim();
  if (!datasetPath) return null;
  return path.isAbsolute(datasetPath)
    ? datasetPath
    : path.resolve(serverDirectory, datasetPath);
}

function recordsFromJson(value) {
  if (Array.isArray(value)) return value;
  for (const key of ["records", "data", "rows"]) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  throw new Error("Hugging Face JSON dataset must contain an array of records.");
}

export async function fetchSchemes() {
  const datasetPath = datasetPathFromEnvironment();
  if (!datasetPath || !existsSync(datasetPath)) {
    console.log(
      "Hugging Face source skipped: HF_DATASET_PATH is missing or the file does not exist."
    );
    return [];
  }

  const contents = await readFile(datasetPath, "utf8");
  const extension = path.extname(datasetPath).toLowerCase();

  if (extension === ".json") {
    return recordsFromJson(JSON.parse(contents));
  }

  if (extension === ".csv") {
    return parse(contents, {
      bom: true,
      columns: true,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true
    });
  }

  throw new Error("HF_DATASET_PATH must point to a .csv or .json file.");
}

export function normalize(record) {
  return normalizeSchemeRecord(
    record,
    HUGGING_FACE_COLUMN_MAP,
    "huggingface"
  );
}

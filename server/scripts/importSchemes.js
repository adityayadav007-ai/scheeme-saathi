import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import Scheme from "../models/Scheme.js";
import { parseSchemeImportCsv } from "../utils/parseSchemeImportCsv.js";

const usage =
  "Usage: npm run import:schemes -- <csv-file> [--dry-run] [--verified] [--overwrite]\n" +
  "       npm run import:schemes:prod -- <csv-file> [--dry-run] [--verified] [--overwrite] [--yes]";

const supportedFlags = new Set([
  "--prod",
  "--dry-run",
  "--verified",
  "--overwrite",
  "--yes"
]);

export function parseImportArguments(args) {
  const unknownFlag = args.find(
    (argument) => argument.startsWith("--") && !supportedFlags.has(argument)
  );
  if (unknownFlag) {
    return { error: `Unknown option: ${unknownFlag}` };
  }

  const filePaths = args.filter((argument) => !argument.startsWith("--"));
  if (filePaths.length !== 1) {
    return { error: usage };
  }

  return {
    filePath: filePaths[0],
    production: args.includes("--prod"),
    dryRun: args.includes("--dry-run"),
    verified: args.includes("--verified"),
    overwrite: args.includes("--overwrite"),
    yes: args.includes("--yes")
  };
}

export function formatDatabaseTarget(uri) {
  try {
    const url = new URL(uri);
    if (
      !["mongodb:", "mongodb+srv:"].includes(url.protocol) ||
      !url.hostname
    ) {
      return null;
    }

    const databasePath = url.pathname.replace(/^\/+/, "").split("/")[0];
    const database = databasePath ? decodeURIComponent(databasePath) : "(default)";
    return `${url.host} / ${database}`;
  } catch {
    return null;
  }
}

async function confirmProductionImport(input = stdin, output = stdout) {
  const readline = createInterface({ input, output });
  try {
    const answer = await readline.question(
      'This will write to the production database. Type "yes" to continue: '
    );
    return answer.trim() === "yes";
  } finally {
    readline.close();
  }
}

export async function importValidRows(
  rows,
  {
    model = Scheme,
    verified = false,
    overwrite = false,
    dryRun = false,
    now = () => new Date()
  } = {}
) {
  const report = {
    inserted: 0,
    updated: 0,
    wouldInsert: 0,
    wouldUpdate: 0,
    skippedRows: [],
    failedRows: []
  };

  for (const { row, scheme } of rows) {
    try {
      const existing = await model
        .findOne({ slug: scheme.slug })
        .select("verified")
        .lean();

      if (existing?.verified && !overwrite) {
        report.skippedRows.push({
          row,
          reasons: ["existing verified scheme is protected; pass --overwrite to replace it"]
        });
        continue;
      }

      if (dryRun) {
        if (existing) report.wouldUpdate += 1;
        else report.wouldInsert += 1;
        continue;
      }

      const importedScheme = {
        ...scheme,
        dataSource: "import",
        verified,
        needsReview: !verified,
        lastSyncedAt: now()
      };
      const result = await model.updateOne(
        { slug: scheme.slug },
        { $set: importedScheme },
        { upsert: true, runValidators: true }
      );

      if (result.upsertedCount > 0 || result.upsertedId) {
        report.inserted += 1;
      } else {
        report.updated += 1;
      }
    } catch (error) {
      report.failedRows.push({
        row,
        reason: `database operation failed (${error.name || "Error"})`
      });
    }
  }

  return report;
}

function printReport({
  parsed,
  imported,
  total,
  dryRun,
  logger
}) {
  logger.log(`Rows read: ${parsed.rowsRead}`);
  logger.log(`Inserted: ${imported.inserted}`);
  logger.log(`Updated: ${imported.updated}`);
  if (dryRun) {
    logger.log(`Would insert: ${imported.wouldInsert}`);
    logger.log(`Would update: ${imported.wouldUpdate}`);
    logger.log("Dry run: no database writes were made.");
  }

  const skippedRows = [...parsed.skippedRows, ...imported.skippedRows];
  logger.log(`Skipped: ${skippedRows.length}`);
  for (const skipped of skippedRows) {
    logger.log(`Skipped row ${skipped.row}: ${skipped.reasons.join("; ")}`);
  }

  logger.log(`Duplicates: ${parsed.duplicates.length}`);
  for (const duplicate of parsed.duplicates) {
    logger.log(
      `Duplicate row ${duplicate.row}: slug "${duplicate.slug}" was first seen on row ${duplicate.firstRow}.`
    );
  }

  logger.log(`Failed: ${imported.failedRows.length}`);
  for (const failure of imported.failedRows) {
    logger.log(`Failed row ${failure.row}: ${failure.reason}`);
  }
  for (const fileError of parsed.fileErrors) {
    logger.log(`CSV error on row ${fileError.row}: ${fileError.reason}`);
  }

  logger.log(
    `Total schemes now in the database: ${Number.isInteger(total) ? total : "unavailable"}`
  );
}

export async function runImport(
  args = process.argv.slice(2),
  dependencies = {}
) {
  const logger = dependencies.logger || console;
  const env = dependencies.env || process.env;
  const readCsv = dependencies.readCsv || readFile;
  const model = dependencies.model || Scheme;
  const connect =
    dependencies.connect || ((uri) => mongoose.connect(uri));
  const disconnect =
    dependencies.disconnect || (() => mongoose.disconnect());
  const confirm =
    dependencies.confirm || confirmProductionImport;

  const options = parseImportArguments(args);
  if (options.error) {
    logger.error(options.error);
    return 1;
  }

  let content;
  try {
    const csvPath = path.resolve(process.cwd(), options.filePath);
    content = await readCsv(csvPath, "utf8");
  } catch {
    logger.error("CSV file could not be read; check its path and permissions.");
    return 1;
  }

  const parsed = parseSchemeImportCsv(content);
  const emptyImportReport = {
    inserted: 0,
    updated: 0,
    wouldInsert: 0,
    wouldUpdate: 0,
    skippedRows: [],
    failedRows: []
  };
  if (parsed.fileErrors.length > 0) {
    printReport({
      parsed,
      imported: emptyImportReport,
      total: null,
      dryRun: options.dryRun,
      logger
    });
    return 1;
  }

  if (options.dryRun) {
    logger.log("Validating CSV in dry-run mode.");
  }

  const uriName = options.production ? "MONGO_URI_PROD" : "MONGO_URI";
  const uri = env[uriName];
  if (!uri) {
    logger.error(
      options.production
        ? "MONGO_URI_PROD is missing; configure it in the server environment."
        : "MONGO_URI is missing; configure it in the server environment."
    );
    return 1;
  }

  if (options.production && !options.yes && !(await confirm())) {
    logger.log("Production import cancelled; no database connection was made.");
    return 1;
  }

  const target = formatDatabaseTarget(uri);
  if (!target) {
    logger.error(`The configured ${uriName} is not a valid MongoDB URI.`);
    return 1;
  }

  logger.log(`Database target: ${target}`);
  let connected = false;
  let exitCode = 0;
  let imported = emptyImportReport;
  let total = null;

  try {
    await connect(uri);
    connected = true;
    imported = await importValidRows(parsed.validRows, {
      model,
      verified: options.verified,
      overwrite: options.overwrite,
      dryRun: options.dryRun
    });
    total = await model.countDocuments({});
  } catch {
    logger.error("Database import failed; verify the database is reachable.");
    exitCode = 1;
  } finally {
    if (connected) {
      try {
        await disconnect();
      } catch {
        logger.error("Database disconnect failed.");
        exitCode = 1;
      }
    }
  }

  printReport({
    parsed,
    imported,
    total,
    dryRun: options.dryRun,
    logger
  });

  const hasInvalidRows = parsed.skippedRows.some((skipped) =>
    skipped.reasons.some((reason) => !reason.startsWith("duplicate slug"))
  );
  if (hasInvalidRows || imported.failedRows.length > 0) exitCode = 1;
  return exitCode;
}

const invokedPath = process.argv[1]
  ? path.resolve(process.argv[1])
  : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  process.exitCode = await runImport();
}

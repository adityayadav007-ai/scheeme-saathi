import { describe, expect, test, vi } from "vitest";
import Scheme from "../models/Scheme.js";
import {
  formatDatabaseTarget,
  importValidRows,
  parseImportArguments,
  runImport
} from "../scripts/importSchemes.js";
import {
  parseSchemeImportCsv,
  schemeImportColumns
} from "../utils/parseSchemeImportCsv.js";

const validValues = {
  name: "छात्र सहायता, योजना",
  ministry: "शिक्षा मंत्रालय",
  level: "Central",
  state: "All",
  category: "Education",
  description: "हिंदी विवरण, जिसमें comma है",
  benefits: "शैक्षणिक सहायता",
  eligibilityText: "आयु 18 से 65 वर्ष",
  minAge: "18",
  maxAge: "65",
  gender: "female ; male",
  category_eligible: "SC; OBC",
  occupation: "student; artisan",
  maxIncome: "0",
  area: "Rural; Urban",
  requiresLand: "true",
  requiresBPL: "",
  documents: "आधार कार्ड; बैंक पासबुक",
  howToApply: "ऑनलाइन आवेदन करें",
  officialLink: "https://example.gov.in/scheme",
  sourceUrl: "",
  keywords: "छात्र; शिक्षा"
};

function csvRow(values) {
  return schemeImportColumns
    .map((column) => {
      const value = values[column] ?? "";
      return `"${String(value).replaceAll('"', '""')}"`;
    })
    .join(",");
}

function csvFile(...rows) {
  return `\uFEFF${schemeImportColumns.join(",")}\r\n${rows.join("\r\n")}`;
}

function fakeModel({ existingBySlug = {}, upsertedCount = 1 } = {}) {
  const model = {
    findOne: vi.fn(({ slug }) => ({
      select: vi.fn(() => ({
        lean: vi.fn().mockResolvedValue(existingBySlug[slug] ?? null)
      }))
    })),
    updateOne: vi.fn().mockResolvedValue({ upsertedCount })
  };
  return model;
}

describe("scheme CSV parsing", () => {
  test("handles BOM, quoted commas, Hindi text, arrays, numbers and booleans", () => {
    const result = parseSchemeImportCsv(csvFile(csvRow(validValues)));

    expect(result.rowsRead).toBe(1);
    expect(result.fileErrors).toEqual([]);
    expect(result.skippedRows).toEqual([]);
    expect(result.validRows[0]).toEqual({
      row: 2,
      scheme: {
        name: "छात्र सहायता, योजना",
        slug: "छात्र-सहायता-योजना",
        ministry: "शिक्षा मंत्रालय",
        level: "Central",
        state: "All",
        category: "Education",
        description: "हिंदी विवरण, जिसमें comma है",
        benefits: "शैक्षणिक सहायता",
        eligibilityText: "आयु 18 से 65 वर्ष",
        eligibility: {
          minAge: 18,
          maxAge: 65,
          gender: ["female", "male"],
          category: ["SC", "OBC"],
          occupation: ["student", "artisan"],
          maxIncome: 0,
          area: ["Rural", "Urban"],
          requiresLand: true,
          requiresBPL: null,
          disability: null
        },
        documents: ["आधार कार्ड", "बैंक पासबुक"],
        keywords: ["छात्र", "शिक्षा"],
        howToApply: "ऑनलाइन आवेदन करें",
        officialLink: "https://example.gov.in/scheme",
        sourceUrl: null
      }
    });
  });

  test("reports every invalid field and keeps only the first duplicate slug", () => {
    const duplicate = { ...validValues, name: "छात्र सहायता योजना!" };
    const invalid = {
      ...validValues,
      name: "Invalid record",
      level: "Local",
      category: "Finance",
      minAge: "70",
      maxAge: "18",
      maxIncome: "-1",
      officialLink: "http://example.gov.in/scheme"
    };
    const result = parseSchemeImportCsv(
      csvFile(csvRow(validValues), csvRow(duplicate), csvRow(invalid))
    );

    expect(result.rowsRead).toBe(3);
    expect(result.validRows).toHaveLength(1);
    expect(result.duplicates).toEqual([
      { row: 3, slug: "छात्र-सहायता-योजना", firstRow: 2 }
    ]);
    expect(result.skippedRows[0]).toEqual({
      row: 3,
      reasons: ['duplicate slug "छात्र-सहायता-योजना" (first seen on row 2)']
    });
    expect(result.skippedRows[1]).toEqual({
      row: 4,
      reasons: [
        "officialLink must be an HTTPS URL on a .gov.in or .nic.in domain",
        "category must be one of: Agriculture, Health, Education, Housing, Employment, Women, Senior Citizens, Business, Other",
        "level must be Central or State",
        "minAge must be less than or equal to maxAge",
        "maxIncome must be at least 0"
      ]
    });
  });

  test("rejects headers that do not exactly match the required order", () => {
    const result = parseSchemeImportCsv(
      `name,officialLink\nExample,https://example.gov.in`
    );

    expect(result.validRows).toEqual([]);
    expect(result.fileErrors).toEqual([
      {
        row: 1,
        reason:
          "CSV header must contain the required columns in the exact specified order"
      }
    ]);
  });

  test("reports malformed CSV syntax with a row number instead of throwing", () => {
    const result = parseSchemeImportCsv(`${schemeImportColumns.join(",")}\n"unterminated`);

    expect(result.validRows).toEqual([]);
    expect(result.fileErrors).toHaveLength(1);
    expect(result.fileErrors[0].row).toBeGreaterThan(0);
    expect(result.fileErrors[0].reason).toMatch(/^CSV parsing failed/);
  });
});

describe("scheme import safeguards", () => {
  test("generates local and production options and hides MongoDB credentials", () => {
    expect(parseImportArguments(["./schemes.csv", "--dry-run"])).toMatchObject({
      filePath: "./schemes.csv",
      dryRun: true,
      production: false
    });
    expect(
      parseImportArguments(["--prod", "./schemes.csv", "--yes"])
    ).toMatchObject({ production: true, yes: true });
    expect(
      formatDatabaseTarget(
        "mongodb://import-user:secret-password@localhost:27017/scheme-saathi?authSource=admin"
      )
    ).toBe("localhost:27017 / scheme-saathi");
  });

  test("requires production confirmation before connecting", async () => {
    const logger = { log: vi.fn(), error: vi.fn() };
    const connect = vi.fn();
    const confirm = vi.fn().mockResolvedValue(false);
    const readCsv = vi.fn().mockResolvedValue(csvFile(csvRow(validValues)));
    const uri = "mongodb+srv://import-user:secret-password@cluster.mongodb.net/prod";

    const result = await runImport(["--prod", "schemes.csv"], {
      env: { MONGO_URI_PROD: uri },
      logger,
      readCsv,
      connect,
      confirm
    });

    expect(result).toBe(1);
    expect(confirm).toHaveBeenCalledOnce();
    expect(connect).not.toHaveBeenCalled();
    expect(logger.log.mock.calls.flat().join(" ")).not.toContain("secret-password");
  });

  test("allows confirmed production import without logging the URI", async () => {
    const logger = { log: vi.fn(), error: vi.fn() };
    const model = fakeModel();
    model.countDocuments = vi.fn().mockResolvedValue(1);
    const connect = vi.fn().mockResolvedValue(undefined);
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const confirm = vi.fn();
    const readCsv = vi.fn().mockResolvedValue(csvFile(csvRow(validValues)));
    const uri = "mongodb+srv://import-user:secret-password@cluster.mongodb.net/prod";

    const result = await runImport(
      ["--prod", "schemes.csv", "--yes"],
      {
        env: { MONGO_URI_PROD: uri },
        logger,
        model,
        readCsv,
        connect,
        disconnect,
        confirm
      }
    );

    expect(result).toBe(0);
    expect(connect).toHaveBeenCalledWith(uri);
    expect(disconnect).toHaveBeenCalledOnce();
    expect(confirm).not.toHaveBeenCalled();
    expect(logger.log.mock.calls.flat().join(" ")).not.toContain("secret-password");
    expect(logger.log).toHaveBeenCalledWith(
      "Database target: cluster.mongodb.net / prod"
    );
  });

  test("upserts by slug with unverified import metadata and timestamps", async () => {
    const model = fakeModel();
    const parsed = parseSchemeImportCsv(csvFile(csvRow(validValues)));
    const timestamp = new Date("2026-01-02T03:04:05.000Z");
    const report = await importValidRows(parsed.validRows, {
      model,
      now: () => timestamp
    });

    expect(report.inserted).toBe(1);
    expect(report.updated).toBe(0);
    expect(model.updateOne).toHaveBeenCalledWith(
      { slug: "छात्र-सहायता-योजना" },
      {
        $set: expect.objectContaining({
          dataSource: "import",
          verified: false,
          needsReview: true,
          lastSyncedAt: timestamp,
          keywords: ["छात्र", "शिक्षा"]
        })
      },
      { upsert: true, runValidators: true }
    );
  });

  test("protects verified records unless overwrite is requested", async () => {
    const parsed = parseSchemeImportCsv(csvFile(csvRow(validValues)));
    const protectedModel = fakeModel({
      existingBySlug: { "छात्र-सहायता-योजना": { verified: true } }
    });
    const protectedReport = await importValidRows(parsed.validRows, {
      model: protectedModel
    });

    expect(protectedReport.skippedRows).toEqual([
      {
        row: 2,
        reasons: [
          "existing verified scheme is protected; pass --overwrite to replace it"
        ]
      }
    ]);
    expect(protectedModel.updateOne).not.toHaveBeenCalled();

    const overwriteModel = fakeModel({
      existingBySlug: { "छात्र-सहायता-योजना": { verified: true } },
      upsertedCount: 0
    });
    const overwriteReport = await importValidRows(parsed.validRows, {
      model: overwriteModel,
      overwrite: true,
      verified: true
    });

    expect(overwriteReport.updated).toBe(1);
    expect(overwriteModel.updateOne.mock.calls[0][1].$set).toMatchObject({
      verified: true,
      needsReview: false
    });
  });

  test("does not write during dry run and accepts import model fields", async () => {
    const model = fakeModel();
    const parsed = parseSchemeImportCsv(csvFile(csvRow(validValues)));
    const report = await importValidRows(parsed.validRows, {
      model,
      dryRun: true
    });

    expect(report.wouldInsert).toBe(1);
    expect(report.inserted).toBe(0);
    expect(model.updateOne).not.toHaveBeenCalled();
    expect(Scheme.schema.path("dataSource").enumValues).toContain("import");
    expect(Scheme.schema.path("keywords")).toBeTruthy();
  });
});

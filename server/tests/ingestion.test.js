import { test, vi } from "vitest";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import * as seedAdapter from "../services/adapters/seedAdapter.js";
import * as huggingFaceAdapter from "../services/adapters/huggingFaceAdapter.js";
import * as dataGovAdapter from "../services/adapters/dataGovAdapter.js";
import Scheme from "../models/Scheme.js";
import { mergeScheme } from "../services/syncService.js";
import { isValidHttpsUrl } from "../utils/normalizeSchemeRecord.js";

test("seed data has 20 unique central schemes with government links and verification notes", async () => {
  const records = await seedAdapter.fetchSchemes();
  assert.equal(records.length, 20);
  assert.equal(new Set(records.map((record) => record.slug)).size, 20);

  for (const record of records) {
    assert.equal(record.level, "Central");
    assert.equal(record.note, "TODO: verify link");
    assert.equal(isValidHttpsUrl(record.officialLink, true), true);
    const normalized = seedAdapter.normalize(record);
    assert.equal(normalized.dataSource, "seed");
    assert.equal(normalized.verified, true);
    assert.ok(normalized.lastSyncedAt instanceof Date);
  }
});

test("seed normalization stamps source metadata", () => {
  const normalized = seedAdapter.normalize({
    name: "Example Scheme",
    officialLink: "https://example.gov.in/"
  });
  assert.equal(normalized.slug, "example-scheme");
  assert.equal(normalized.dataSource, "seed");
  assert.equal(normalized.verified, true);
  assert.equal(normalized.needsReview, false);
  assert.ok(normalized.lastSyncedAt instanceof Date);
});

test("all seed records satisfy the Scheme model", async () => {
  const records = await seedAdapter.fetchSchemes();
  for (const record of records) {
    await new Scheme(seedAdapter.normalize(record)).validate();
  }
});

test("Scheme model accepts Mongo-safe per-field provenance keys", async () => {
  const scheme = new Scheme({
    name: "Example Scheme",
    slug: "example-scheme",
    officialLink: "https://example.gov.in/",
    sourceFields: {
      name: "seed",
      "eligibility:minAge": "seed"
    }
  });
  await scheme.validate();
  assert.equal(scheme.sourceFields.get("eligibility:minAge"), "seed");
});

test("Hugging Face column mapping marks normalized records for review", () => {
  const normalized = huggingFaceAdapter.normalize({
    scheme_name: "Local Dataset Scheme",
    scheme_category: "Education",
    official_link: "https://example.gov.in/scheme",
    min_age: "18",
    eligible_gender: "female, male"
  });

  assert.equal(normalized.name, "Local Dataset Scheme");
  assert.equal(normalized.category, "Education");
  assert.equal(normalized.eligibility.minAge, 18);
  assert.deepEqual(normalized.eligibility.gender, ["female", "male"]);
  assert.equal(normalized.dataSource, "huggingface");
  assert.equal(normalized.verified, false);
  assert.equal(normalized.needsReview, true);
});

test("Hugging Face mapping supports the supplied dataset headers", () => {
  const normalized = huggingFaceAdapter.normalize({
    scheme_name: "Header Mapped Scheme",
    ministry: "Example Ministry",
    category: "Education",
    details: "Support for eligible students.",
    eligibility: "Applicants aged 18 to 30 years may apply.",
    benefits: "Education support",
    application_process: "Apply through the official portal.",
    documents: "Identity proof, application form",
    url: "https://example.gov.in/scheme"
  });

  assert.equal(normalized.name, "Header Mapped Scheme");
  assert.equal(normalized.ministry, "Example Ministry");
  assert.equal(normalized.category, "Education");
  assert.equal(normalized.description, "Support for eligible students.");
  assert.equal(
    normalized.eligibilityText,
    "Applicants aged 18 to 30 years may apply."
  );
  assert.equal(normalized.benefits, "Education support");
  assert.equal(normalized.howToApply, "Apply through the official portal.");
  assert.deepEqual(normalized.documents, [
    "Identity proof",
    "application form"
  ]);
  assert.equal(normalized.officialLink, "https://example.gov.in/scheme");
});

test("Hugging Face adapter parses CSV records from the configured file", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "scheme-saathi-"));
  const csvPath = path.join(directory, "schemes.csv");
  const oldDatasetPath = process.env.HF_DATASET_PATH;

  try {
    await writeFile(
      csvPath,
      "scheme_name,scheme_category,official_link\nTest CSV Scheme,Education,https://example.gov.in/test\n",
      "utf8"
    );
    process.env.HF_DATASET_PATH = csvPath;
    const records = await huggingFaceAdapter.fetchSchemes();

    assert.equal(records.length, 1);
    assert.equal(
      huggingFaceAdapter.normalize(records[0]).name,
      "Test CSV Scheme"
    );
  } finally {
    if (oldDatasetPath === undefined) delete process.env.HF_DATASET_PATH;
    else process.env.HF_DATASET_PATH = oldDatasetPath;
    await rm(directory, { recursive: true, force: true });
  }
});

test("Hugging Face adapter skips a missing configured file", async () => {
  const missingPath = path.join(
    os.tmpdir(),
    `scheme-saathi-missing-${Date.now()}.json`
  );
  const oldDatasetPath = process.env.HF_DATASET_PATH;

  try {
    process.env.HF_DATASET_PATH = missingPath;
    assert.deepEqual(await huggingFaceAdapter.fetchSchemes(), []);
  } finally {
    if (oldDatasetPath === undefined) delete process.env.HF_DATASET_PATH;
    else process.env.HF_DATASET_PATH = oldDatasetPath;
  }
});

test("Hugging Face adapter reads JSON records and nested eligibility fields", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "scheme-saathi-"));
  const jsonPath = path.join(directory, "schemes.json");
  const oldDatasetPath = process.env.HF_DATASET_PATH;

  try {
    await writeFile(
      jsonPath,
      JSON.stringify({
        data: [
          {
            schemeName: "Nested JSON Scheme",
            officialUrl: "https://example.gov.in/nested",
            eligibility: { minAge: 21, requiresBPL: "yes" }
          }
        ]
      }),
      "utf8"
    );
    process.env.HF_DATASET_PATH = jsonPath;

    const [record] = await huggingFaceAdapter.fetchSchemes();
    const normalized = huggingFaceAdapter.normalize(record);

    assert.equal(normalized.name, "Nested JSON Scheme");
    assert.equal(normalized.eligibility.minAge, 21);
    assert.equal(normalized.eligibility.requiresBPL, true);
  } finally {
    if (oldDatasetPath === undefined) delete process.env.HF_DATASET_PATH;
    else process.env.HF_DATASET_PATH = oldDatasetPath;
    await rm(directory, { recursive: true, force: true });
  }
});

test("data.gov.in adapter paginates through every result page", async () => {
  const firstPage = [
    { scheme_name: "Scheme One", official_link: "https://one.gov.in" },
    { scheme_name: "Scheme Two", official_link: "https://two.gov.in" }
  ];
  const secondPage = [
    { scheme_name: "Scheme Three", official_link: "https://three.gov.in" }
  ];
  const httpClient = {
    get: vi
      .fn()
      .mockResolvedValueOnce({
        data: { records: firstPage, total: 3 }
      })
      .mockResolvedValueOnce({
        data: { records: secondPage, total: 3 }
      })
  };
  const delayFn = vi.fn();

  const records = await dataGovAdapter.fetchSchemes({
    httpClient,
    apiKey: "test-key",
    resourceIds: ["resource-1"],
    pageSize: 2,
    delayFn
  });

  assert.equal(records.length, 3);
  assert.deepEqual(
    httpClient.get.mock.calls.map(([, config]) => config.params.offset),
    [0, 2]
  );
  assert.equal(httpClient.get.mock.calls[0][1].params["api-key"], "test-key");
  assert.equal(
    dataGovAdapter.normalize(records[2]).officialLink,
    "https://three.gov.in"
  );
  assert.equal(dataGovAdapter.normalize(records[0]).verified, false);
});

test("data.gov.in adapter retries rate limits with backoff", async () => {
  const httpClient = {
    get: vi
      .fn()
      .mockRejectedValueOnce({
        response: { status: 429, headers: { "retry-after": "2" } }
      })
      .mockResolvedValueOnce({ data: { records: [] } })
  };
  const delayFn = vi.fn();

  const records = await dataGovAdapter.fetchSchemes({
    httpClient,
    apiKey: "test-key",
    resourceIds: "resource-1",
    pageSize: 2,
    delayFn
  });

  assert.deepEqual(records, []);
  assert.equal(httpClient.get.mock.calls.length, 2);
  assert.deepEqual(delayFn.mock.calls, [[2000]]);
});

test("data.gov.in adapter skips without credentials and resource IDs", async () => {
  const oldApiKey = process.env.DATA_GOV_API_KEY;
  const oldResourceIds = process.env.DATA_GOV_RESOURCE_IDS;

  try {
    process.env.DATA_GOV_API_KEY = "";
    process.env.DATA_GOV_RESOURCE_IDS = "";
    const httpClient = { get: vi.fn() };
    assert.deepEqual(await dataGovAdapter.fetchSchemes({ httpClient }), []);
    assert.equal(httpClient.get.mock.calls.length, 0);
  } finally {
    if (oldApiKey === undefined) delete process.env.DATA_GOV_API_KEY;
    else process.env.DATA_GOV_API_KEY = oldApiKey;
    if (oldResourceIds === undefined) delete process.env.DATA_GOV_RESOURCE_IDS;
    else process.env.DATA_GOV_RESOURCE_IDS = oldResourceIds;
  }
});

test("higher-priority sources replace lower-priority non-empty values", () => {
  const merged = mergeScheme(
    {
      slug: "example",
      dataSource: "datagov",
      name: "Dataset name",
      benefits: "Dataset benefit",
      eligibility: { minAge: 20 }
    },
    {
      slug: "example",
      dataSource: "seed",
      name: "Curated name",
      benefits: "Curated benefit",
      eligibility: { minAge: 18 },
      lastSyncedAt: new Date("2026-01-01T00:00:00.000Z")
    }
  );

  assert.equal(merged.name, "Curated name");
  assert.equal(merged.benefits, "Curated benefit");
  assert.equal(merged.eligibility.minAge, 18);
  assert.equal(merged.dataSource, "seed");
});

test("a verified seed record stays verified when lower-priority sources merge", () => {
  const merged = mergeScheme(
    {
      slug: "pm-kisan",
      dataSource: "seed",
      verified: true,
      sourceFields: { name: "seed", officialLink: "seed" },
      name: "PM-KISAN",
      officialLink: "https://pmkisan.gov.in/",
      eligibility: { minAge: 18 }
    },
    {
      slug: "pm-kisan",
      dataSource: "huggingface",
      verified: false,
      name: "PM Kisan Scheme",
      officialLink: "https://example.gov.in/other",
      eligibility: { minAge: 20 },
      lastSyncedAt: new Date("2026-01-01T00:00:00.000Z")
    }
  );

  assert.equal(merged.verified, true);
  assert.equal(merged.name, "PM-KISAN");
  assert.equal(merged.officialLink, "https://pmkisan.gov.in/");
  assert.equal(merged.eligibility.minAge, 18);
});

test("lower-priority sources fill empty values but do not erase or replace populated values", () => {
  const merged = mergeScheme(
    {
      slug: "example",
      dataSource: "seed",
      name: "Curated name",
      description: null,
      benefits: "Curated benefit",
      eligibility: { minAge: null, maxAge: 40 }
    },
    {
      slug: "example",
      dataSource: "datagov",
      name: "Dataset name",
      description: "Added description",
      benefits: "",
      eligibility: { minAge: 18, maxAge: null },
      lastSyncedAt: new Date("2026-01-01T00:00:00.000Z")
    }
  );

  assert.equal(merged.name, "Curated name");
  assert.equal(merged.description, "Added description");
  assert.equal(merged.benefits, "Curated benefit");
  assert.equal(merged.eligibility.minAge, 18);
  assert.equal(merged.eligibility.maxAge, 40);
  assert.equal(merged.dataSource, "seed");
});

test("source priority is tracked independently for each populated field", () => {
  const merged = mergeScheme(
    {
      slug: "example",
      dataSource: "seed",
      sourceFields: {
        name: "seed",
        description: "datagov"
      },
      name: "Curated name",
      description: "Previous registry description",
      eligibility: {}
    },
    {
      slug: "example",
      dataSource: "datagov",
      name: "New registry name",
      description: "Updated registry description",
      eligibility: {},
      lastSyncedAt: new Date("2026-01-01T00:00:00.000Z")
    }
  );

  assert.equal(merged.name, "Curated name");
  assert.equal(merged.description, "Updated registry description");
  assert.equal(merged.sourceFields.name, "seed");
  assert.equal(merged.sourceFields.description, "datagov");
  assert.equal(merged.dataSource, "seed");
});

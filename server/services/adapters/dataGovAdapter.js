import axios from "axios";
import { DATA_GOV_COLUMN_MAP } from "../../config/columnMaps.js";
import { normalizeSchemeRecord } from "../../utils/normalizeSchemeRecord.js";

const apiBaseUrl = "https://api.data.gov.in/resource";
const pageLimit = 1000;
const maxRetries = 3;
const retryBaseDelayMs = 1000;
const maxPagesPerResource = 1000;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function retryDelay(error, attempt) {
  const retryAfter = error.response?.headers?.["retry-after"];
  const retryAfterSeconds = Number(retryAfter);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.min(retryAfterSeconds * 1000, 30_000);
  }
  if (typeof retryAfter === "string") {
    const retryAt = Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) {
      return Math.min(Math.max(0, retryAt - Date.now()), 30_000);
    }
  }
  return retryBaseDelayMs * 2 ** (attempt - 1);
}

function isRetryable(error) {
  const status = error.response?.status;
  return !status || status === 429 || status >= 500;
}

async function requestPage(
  resourceId,
  apiKey,
  offset,
  { httpClient, delayFn, pageSize }
) {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await httpClient.get(
        `${apiBaseUrl}/${encodeURIComponent(resourceId)}`,
        {
          params: {
            "api-key": apiKey,
            format: "json",
            limit: pageSize,
            offset
          },
          timeout: 20_000
        }
      );

      if (!Array.isArray(response.data?.records)) {
        throw new Error("data.gov.in response did not contain a records array.");
      }

      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const retryable = isRetryable(error);
      if (!retryable || attempt === maxRetries) {
        const detail = status ? `HTTP ${status}` : error.message;
        throw new Error(`data.gov.in request failed: ${detail}`);
      }

      await delayFn(retryDelay(error, attempt));
    }
  }

  throw new Error("data.gov.in request failed after retries.");
}

export async function fetchSchemes({
  httpClient = axios,
  apiKey = process.env.DATA_GOV_API_KEY?.trim(),
  resourceIds = process.env.DATA_GOV_RESOURCE_IDS ?? "",
  delayFn = delay,
  pageSize = pageLimit,
  maxPages = maxPagesPerResource
} = {}) {
  const normalizedResourceIds = (Array.isArray(resourceIds)
    ? resourceIds
    : String(resourceIds).split(",")
  )
    .map((resourceId) => String(resourceId).trim())
    .filter(Boolean);

  if (!apiKey || normalizedResourceIds.length === 0) {
    console.log(
      "data.gov.in source skipped: DATA_GOV_API_KEY or DATA_GOV_RESOURCE_IDS is missing."
    );
    return [];
  }

  const records = [];

  for (const resourceId of normalizedResourceIds) {
    let offset = 0;
    let pageCount = 0;

    while (pageCount < maxPages) {
      const page = await requestPage(resourceId, apiKey, offset, {
        httpClient,
        delayFn,
        pageSize
      });
      records.push(...page.records);
      pageCount += 1;
      offset += page.records.length;

      const total = Number(page.total ?? page.count);
      if (
        page.records.length < pageSize ||
        (Number.isFinite(total) && total > 0 && offset >= total)
      ) {
        break;
      }

      if (page.records.length === 0) break;
    }

    if (pageCount === maxPages) {
      console.warn(
        `data.gov.in resource ${resourceId} reached the pagination safety limit.`
      );
    }
  }

  return records;
}

export function normalize(record) {
  return normalizeSchemeRecord(record, DATA_GOV_COLUMN_MAP, "datagov");
}

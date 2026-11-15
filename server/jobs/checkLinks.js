import axios from "axios";
import Scheme from "../models/Scheme.js";

const requestTimeoutMs = 10_000;
const requestDelayMs = 250;
const maxConcurrency = 5;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function classifyStatus(status) {
  if (status === 403 || status === 429) return "unknown";
  if (status === 404 || status === 410 || status >= 500) return "broken";
  if (status >= 200 && status < 400) return "ok";
  return "unknown";
}

async function sendRequest(client, method, url, timeoutMs, delayMs) {
  try {
    return await client[method](url, {
      timeout: timeoutMs,
      validateStatus: () => true
    });
  } finally {
    if (delayMs > 0) await delay(delayMs);
  }
}

export async function checkOfficialLink(
  url,
  {
    httpClient = axios,
    timeoutMs = requestTimeoutMs,
    delayMs = requestDelayMs
  } = {}
) {
  try {
    const headResponse = await sendRequest(
      httpClient,
      "head",
      url,
      timeoutMs,
      delayMs
    );
    if (headResponse.status === 405 || headResponse.status === 501) {
      const getResponse = await sendRequest(
        httpClient,
        "get",
        url,
        timeoutMs,
        delayMs
      );
      return classifyStatus(getResponse.status);
    }
    return classifyStatus(headResponse.status);
  } catch {
    return "broken";
  }
}

export async function checkAllLinks({
  schemeModel = Scheme,
  httpClient = axios,
  concurrency = maxConcurrency,
  timeoutMs = requestTimeoutMs,
  delayMs = requestDelayMs,
  now = () => new Date()
} = {}) {
  const schemes = await schemeModel.find({}, "_id officialLink").lean();
  const summary = { ok: 0, broken: 0, unknown: 0 };
  let nextIndex = 0;

  async function checkNext() {
    while (nextIndex < schemes.length) {
      const scheme = schemes[nextIndex];
      nextIndex += 1;
      const linkStatus = await checkOfficialLink(scheme.officialLink, {
        httpClient,
        timeoutMs,
        delayMs
      });
      const update = {
        linkStatus,
        linkCheckedAt: now()
      };
      if (linkStatus === "broken") update.needsReview = true;

      await schemeModel.updateOne({ _id: scheme._id }, { $set: update });
      summary[linkStatus] += 1;
    }
  }

  const workerCount = Math.max(
    1,
    Math.min(Math.floor(concurrency) || 1, maxConcurrency, schemes.length)
  );
  await Promise.all(Array.from({ length: workerCount }, () => checkNext()));

  console.log(
    `Link check summary: ok ${summary.ok}, broken ${summary.broken}, unknown ${summary.unknown}`
  );
  return summary;
}

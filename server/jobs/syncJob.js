import cron from "node-cron";
import { getEnabledSources, syncSources } from "../services/syncService.js";

const networkSources = new Set(["datagov"]);
const maxRetries = 3;
const retryBaseDelayMs = 1000;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function retryFailedNetworkSources(sources, results) {
  for (const source of sources.filter((name) => networkSources.has(name))) {
    let failed = results[source]?.failed > 0;
    for (let attempt = 1; failed && attempt <= maxRetries; attempt += 1) {
      const waitMs = retryBaseDelayMs * 2 ** (attempt - 1);
      console.warn(
        `Retrying ${source} after failure in ${waitMs}ms (attempt ${attempt}/${maxRetries}).`
      );
      await delay(waitMs);
      const retryResults = await syncSources([source]);
      results[source] = retryResults[source];
      failed = results[source]?.failed > 0;
    }
  }
}

export function startSyncJob() {
  const task = cron.schedule(
    "0 2 * * *",
    async () => {
      const sources = getEnabledSources();
      console.log("Starting daily scheme data sync.");
      try {
        const results = await syncSources(sources);
        await retryFailedNetworkSources(sources, results);
      } catch (error) {
        console.error(`Daily scheme sync failed: ${error.message}`);
      }
    },
    { timezone: "Asia/Kolkata" }
  );

  console.log("Daily scheme sync scheduled for 2:00 AM Asia/Kolkata.");
  return task;
}

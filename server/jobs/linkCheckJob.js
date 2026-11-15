import cron from "node-cron";
import { checkAllLinks } from "./checkLinks.js";

export function startLinkCheckJob() {
  const task = cron.schedule(
    "0 3 * * 0",
    async () => {
      console.log("Starting weekly government link check.");
      try {
        await checkAllLinks();
      } catch (error) {
        console.error(`Weekly link check failed: ${error.message}`);
      }
    },
    { timezone: "Asia/Kolkata" }
  );

  console.log("Weekly link check scheduled for Sunday 3:00 AM Asia/Kolkata.");
  return task;
}

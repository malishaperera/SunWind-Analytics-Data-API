import cron from "node-cron";
import { runSeed } from "./production-seed";

export const initializeSeedScheduler = () => {
    // 🌙 Every day at 12:00 AM (midnight UTC)
    const schedule = process.env.SEED_CRON || "0 0 * * *";

    cron.schedule(schedule, async () => {
        console.log(`[SEED] ${new Date().toISOString()} Running daily seed...`);
        try {
            await runSeed();
            console.log("[SEED] Daily seed completed successfully");
        } catch (error) {
            console.error("[SEED] Daily seed failed", error);
        }
    });

    console.log(`[SEED] Scheduler initialized (${schedule})`);
};

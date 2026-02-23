import cron from "node-cron";
import { seed } from "./production-seed";

export const initializeSeedScheduler = () => {
    // Every day at 12:00 AM (midnight)
    const schedule = process.env.SYNC_CRON_SCHEDULE || '0 0 * * *';

    cron.schedule(schedule, async () => {
        console.log(`[SEED] ${new Date().toISOString()} Running daily seed...`);
        try {
            await seed();
            console.log("[SEED] Daily seed completed successfully");
        } catch (error) {
            console.error("[SEED] Daily seed failed", error);
        }
    });
    console.log(`[SEED] Scheduler initialized (${schedule})`);
};

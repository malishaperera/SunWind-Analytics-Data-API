import mongoose from "mongoose";
import { EnergyGenerationRecord } from "./entities/EnergyGenerationRecord";
import dotenv from "dotenv";
import { connectDB } from "./db";

dotenv.config();

async function seed() {
    const serialNumber = "SU-0001";

    try {
        await connectDB();
        await EnergyGenerationRecord.deleteMany({});

        const records = [];
        const startDate = new Date("2025-08-01T08:00:00Z");
        const endDate = new Date("2025-11-23T08:00:00Z");

        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const hour = currentDate.getUTCHours();
            const month = currentDate.getUTCMonth();

            // ---------- Normal baseline ----------
            let baseEnergy = 200;
            if (month >= 5 && month <= 7) baseEnergy = 300;
            else if (month >= 2 && month <= 4) baseEnergy = 250;
            else if (month >= 8 && month <= 10) baseEnergy = 200;
            else baseEnergy = 150;

            let energyGenerated = 0;

            // ---------- Normal daylight generation ----------
            if (hour >= 6 && hour <= 18) {
                let multiplier = 1.2;
                if (hour >= 10 && hour <= 14) multiplier = 1.5;

                energyGenerated = Math.round(
                    baseEnergy * multiplier * (0.8 + Math.random() * 0.4)
                );
            }

            // =================================================
            // 🔴 ANOMALY INJECTION
            // =================================================

            // 1️⃣ Night-time generation anomaly (5%)
            if ((hour < 6 || hour > 18) && Math.random() < 0.05) {
                energyGenerated = 120; // ❌ should be 0 at night
            }

            // 2️⃣ Sudden spike anomaly (2%)
            if (Math.random() < 0.02) {
                energyGenerated = baseEnergy * 6; // ❌ unrealistic spike
            }

            // 3️⃣ Sudden drop during peak hours (3%)
            if (hour >= 10 && hour <= 14 && Math.random() < 0.03) {
                energyGenerated = 0; // ❌ unexpected drop
            }

            // 4️⃣ Long zero-generation day (simulate hardware failure)
            if (currentDate.getUTCDate() === 15) {
                energyGenerated = 0; // ❌ whole day no production
            }

            records.push({
                serialNumber,
                timestamp: new Date(currentDate),
                energyGenerated,
                intervalHours: 2,
            });

            currentDate = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000);
        }

        await EnergyGenerationRecord.insertMany(records);

        console.log("Seed completed with anomaly data (Task 5 ready)");
    } catch (error) {
        console.error("Seeding error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

seed();

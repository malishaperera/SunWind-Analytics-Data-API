import { EnergyGenerationRecord } from "../entities/EnergyGenerationRecord";
import dotenv from "dotenv";
import { connectDB } from "../db";

dotenv.config();

type SolarProfile = {
    serialNumber: string;
    capacity: number;
    efficiency: number;
};

type DayAnomalyType = "NONE" | "SPIKE" | "ZERO" | "NIGHT";

export const runSeed = async () => {
    try {
        await connectDB();
        console.log("Starting realistic incremental seed...");

        const solarUnits: SolarProfile[] = [
            { serialNumber: "SU-0001", capacity: 220, efficiency: 1.1 },
            { serialNumber: "SU-0002", capacity: 180, efficiency: 0.9 },
            { serialNumber: "SU-0003", capacity: 300, efficiency: 1.3 },
            { serialNumber: "SU-0004", capacity: 250, efficiency: 1.0 },
            { serialNumber: "SU-0005", capacity: 150, efficiency: 0.8 },
        ];

        // Find last generated record
        const lastRecord = await EnergyGenerationRecord
            .findOne()
            .sort({ timestamp: -1 });

        let startDate: Date;

        if (lastRecord) {
            startDate = new Date(
                lastRecord.timestamp.getTime() + 2 * 60 * 60 * 1000
            );
            console.log("Continuing seed from:", startDate.toISOString());
        } else {
            startDate = new Date(
                Date.now() - 30 * 24 * 60 * 60 * 1000
            );
            console.log("First seed, starting from:", startDate.toISOString());
        }

        const now = new Date();
        let currentDate = new Date(startDate);
        const records: any[] = [];

        let currentDayKey = "";
        let dayAnomalyType: DayAnomalyType = "NONE";
        let anomalyUnit: string | null = null;

        while (currentDate <= now) {
            const dayKey = currentDate.toISOString().slice(0, 10);
            const hour = currentDate.getUTCHours();
            const month = currentDate.getUTCMonth();

            // New day → decide anomaly ONCE per day
            if (dayKey !== currentDayKey) {
                currentDayKey = dayKey;

                const isAnomalyDay = Math.random() < 0.06; // 7%

                if (!isAnomalyDay) {
                    dayAnomalyType = "NONE";
                    anomalyUnit = null;
                } else {
                    const r = Math.random();
                    if (r < 0.6) dayAnomalyType = "SPIKE";      // 60%
                    else if (r < 0.9) dayAnomalyType = "NIGHT"; // 25%
                    else dayAnomalyType = "ZERO";// 15%

                    // Apply anomaly to ONE unit only
                    anomalyUnit =
                        solarUnits[Math.floor(Math.random() * solarUnits.length)]
                            .serialNumber;
                }
            }

            for (const unit of solarUnits) {
                let seasonalFactor = 1;

                //Seasonal effect
                if (month >= 5 && month <= 7) seasonalFactor = 1.2;
                else if (month >= 2 && month <= 4) seasonalFactor = 1.1;
                else if (month >= 8 && month <= 10) seasonalFactor = 1.0;
                else seasonalFactor = 0.85;

                let energyGenerated = 0;

                // Normal daytime generation
                if (hour >= 6 && hour <= 18) {
                    const sunPeak = hour >= 10 && hour <= 14 ? 1.5 : 1.1;

                    energyGenerated = Math.round(
                        unit.capacity *
                        unit.efficiency *
                        seasonalFactor *
                        sunPeak *
                        (0.75 + Math.random() * 0.4)
                    );
                }

                // Apply anomaly ONLY if today is anomaly day
                if (unit.serialNumber === anomalyUnit) {
                    if (dayAnomalyType === "ZERO" && hour >= 11 && hour <= 12) {
                        energyGenerated = 0;
                    }

                    if (dayAnomalyType === "SPIKE" && hour >= 10 && hour <= 14) {
                        energyGenerated = Math.round(energyGenerated * 2);
                    }

                    if (
                        dayAnomalyType === "NIGHT" &&
                        (hour < 6 || hour > 18)
                    ) {
                        energyGenerated = Math.round(40 + Math.random() * 60);
                    }
                }

                records.push({
                    serialNumber: unit.serialNumber,
                    timestamp: new Date(currentDate),
                    energyGenerated,
                    intervalHours: 2,
                });
            }

            //Move forward by 2 hours
            currentDate = new Date(
                currentDate.getTime() + 2 * 60 * 60 * 1000
            );
        }

        if (records.length > 0) {
            await EnergyGenerationRecord.insertMany(records);
            console.log(`Inserted ${records.length} records`);
        } else {
            console.log("No new records to insert");
        }

        console.log("Realistic incremental seed completed successfully");
    } catch (error) {
        console.error("Seed error:", error);
    }
};

runSeed();

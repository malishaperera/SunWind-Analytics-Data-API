import { EnergyGenerationRecord } from "../entities/EnergyGenerationRecord";
import dotenv from "dotenv";
import { connectDB } from "../db";

dotenv.config();

type SolarProfile = {
    serialNumber: string;
    capacity: number;      // base panel size
    efficiency: number;    // performance factor
    faultRate: number;     // probability of failure
};

export const runSeed = async () => {
    try {
        await connectDB();

        console.log("Starting seed process...");

        // solar unit profiles
        const solarUnits: SolarProfile[] = [
            { serialNumber: "SU-0001", capacity: 220, efficiency: 1.1, faultRate: 0.02 },
            { serialNumber: "SU-0002", capacity: 180, efficiency: 0.9, faultRate: 0.05 },
            { serialNumber: "SU-0003", capacity: 300, efficiency: 1.3, faultRate: 0.01 },
            { serialNumber: "SU-0004", capacity: 250, efficiency: 1.0, faultRate: 0.03 },
            { serialNumber: "SU-0005", capacity: 150, efficiency: 0.8, faultRate: 0.06 },
        ];

        const cutoff = new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
        );

        await EnergyGenerationRecord.deleteMany({
            timestamp: { $lt: cutoff },
        });

        console.log("Old records removed (older than 30 days)");

        const records: any[] = [];

        const now = new Date();
        let currentDate = new Date(cutoff);

        while (currentDate <= now) {
            const hour = currentDate.getUTCHours();
            const month = currentDate.getUTCMonth();

            for (const unit of solarUnits) {
                let seasonalFactor = 1;//normal weather

                //Seasonal effect
                if (month >= 5 && month <= 7) seasonalFactor = 1.2;
                else if (month >= 2 && month <= 4) seasonalFactor = 1.1;
                else if (month >= 8 && month <= 10) seasonalFactor = 1.0;
                else seasonalFactor = 0.85;

                let energyGenerated = 0;

                // Daytime generation
                if (hour >= 6 && hour <= 18) {
                    let sunPeak = hour >= 10 && hour <= 14 ? 1.5 : 1.1;

                    energyGenerated = Math.round(
                        unit.capacity *
                        unit.efficiency *
                        seasonalFactor *
                        sunPeak *
                        (0.7 + Math.random() * 0.6)
                    );
                }

                // ZERO OUTPUT anomaly
                if (Math.random() < unit.faultRate && hour >= 10 && hour <= 14) {
                    energyGenerated = 0;
                }

                // NIGHT GENERATION anomaly
                if ((hour < 6 || hour > 18) && Math.random() < 0.04) {
                    energyGenerated = Math.round(80 + Math.random() * 80);
                }

                // SPIKE anomaly
                if (Math.random() < 0.015) {
                    energyGenerated = Math.round(energyGenerated * 2.5);
                }

                records.push({
                    serialNumber: unit.serialNumber,
                    timestamp: new Date(currentDate),
                    energyGenerated,
                    intervalHours: 2,
                });
            }

            // Move forward by 2 hours
            currentDate = new Date(
                currentDate.getTime() + 2 * 60 * 60 * 1000
            );
        }

        await EnergyGenerationRecord.insertMany(records);

        console.log(`Seed completed successfully`);
        console.log(`Inserted records: ${records.length}`);

    } catch (error) {
        console.error("Seed error:", error);
    }
};

runSeed();

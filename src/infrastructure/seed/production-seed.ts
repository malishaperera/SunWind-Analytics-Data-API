import { EnergyGenerationRecord } from "../entities/EnergyGenerationRecord";
import dotenv from "dotenv";
import { connectDB } from "../db";

dotenv.config();
export const runSeed = async () => {
    try {
        await connectDB();

        const serialNumbers = [
            "SU-0001",
            "SU-0002",
            "SU-0003",
            "SU-0004",
            "SU-0005",
        ];

        const records = [];

        const now = new Date();
        let currentDate = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000 // 1 month
        );

        while (currentDate <= now) {
            const hour = currentDate.getUTCHours();
            const month = currentDate.getUTCMonth();

            for (const serialNumber of serialNumbers) {
                let baseEnergy = 200;
                if (month >= 5 && month <= 7) baseEnergy = 300;
                else if (month >= 2 && month <= 4) baseEnergy = 250;
                else if (month >= 8 && month <= 10) baseEnergy = 200;
                else baseEnergy = 150;

                let energyGenerated = 0;

                if (hour >= 6 && hour <= 18) {
                    let multiplier = 1.2;
                    if (hour >= 10 && hour <= 14) multiplier = 1.5;

                    energyGenerated = Math.round(
                        baseEnergy * multiplier * (0.8 + Math.random() * 0.4)
                    );
                }

                // anomalies
                if ((hour < 6 || hour > 18) && Math.random() < 0.05) {
                    energyGenerated = 120;
                }

                if (Math.random() < 0.02) {
                    energyGenerated = baseEnergy * 6;
                }

                if (hour >= 10 && hour <= 14 && Math.random() < 0.03) {
                    energyGenerated = 0;
                }

                records.push({
                    serialNumber,
                    timestamp: new Date(currentDate),
                    energyGenerated,
                    intervalHours: 2,
                });
            }

            currentDate = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000);
        }

        await EnergyGenerationRecord.insertMany(records);
        console.log(`✅ 1 Month seed completed: ${records.length} records`);

    } catch (error) {
        console.error("Seed error:", error);
    }
};
runSeed();
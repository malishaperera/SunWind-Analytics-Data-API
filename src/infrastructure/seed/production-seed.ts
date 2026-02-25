import mongoose from "mongoose";
import dotenv from "dotenv";
import {EnergyGenerationRecord} from "../entities/EnergyGenerationRecord";
import {connectDB} from "../db";

dotenv.config();

const solarUnits = [
    { serialNumber: "SU-0001", capacity: 5.0},
    { serialNumber: "SU-0002", capacity: 3.5},
    { serialNumber: "SU-0003", capacity: 10.0},
    { serialNumber: "SU-0004", capacity: 4.2},
    { serialNumber: "SU-0005", capacity: 6.0},
];

const TOTAL_DAYS = 30;
const SUNRISE = 6;
const SUNSET = 18;

function getSolarEnergyGenerated(hour: number, month: number, capacity: number): number {
    if (hour < SUNRISE || hour > SUNSET) return 0;

    let seasonalCapacity = capacity;
    if (month >= 3 && month <= 6) {
        seasonalCapacity = capacity * 1.2; // 20% more power in Summer
    }

    const radians = ((hour - SUNRISE) / (SUNSET - SUNRISE)) * Math.PI;
    const intensity = Math.sin(radians);

    return seasonalCapacity * intensity;
}

export const seed = async () => {

    try{
        // connectDB();
        console.log("Connected to database. Starting seeding process...");
        await EnergyGenerationRecord.deleteMany({});
        console.log("Database cleared. Starting fresh...");

        for (const unit of solarUnits) {

            const records = [];
            let currentDate = new Date();
            currentDate.setDate(currentDate.getDate() - TOTAL_DAYS);
            currentDate.setHours(0, 0, 0, 0);
            const endDate = new Date()

            while(currentDate <= endDate) {

                const hour = currentDate.getHours();
                const month = currentDate.getMonth();

                // Calculate normal energy
                let energy = getSolarEnergyGenerated(hour, month, unit.capacity);

                const anomalyRoll  = Math.random();

                if (hour >= SUNRISE && hour <= SUNSET) {
                    if (anomalyRoll  < 0.01) {
                        energy = 0; // 1% Failure
                    } else if (anomalyRoll  < 0.02) {
                        energy = unit.capacity * 10; // 1% Spike
                    } else if (anomalyRoll  < 0.03) {
                        energy = energy * 0.2; // 1% Cloudy day - 80% drop
                    }else if (anomalyRoll  < 0.04) {
                        energy = unit.capacity * 0.5; //  "Clipping" - Locked at 50% power
                    }
                }

                records.push({
                    serialNumber: unit.serialNumber,
                    energyGenerated: Number(energy.toFixed(2)),
                    timestamp: new Date(currentDate),
                    intervalHours: 1,
                });
                currentDate.setHours(currentDate.getHours() + 1);
            }
            await EnergyGenerationRecord.insertMany(records);
        }
        console.log("Seeding completed successfully!");

    }catch (err){
        console.error("Error seeding data:", err);
    }
}

seed();
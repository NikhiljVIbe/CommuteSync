import fs from 'fs';
import path from 'path';

const dbPath = path.join(__dirname, '../../data.json');

export interface ISchedule {
    _id: string;
    email: string;
    source: {
        address: string;
        lat: number;
        lng: number;
        placeId: string;
    };
    destination: {
        address: string;
        lat: number;
        lng: number;
        placeId: string;
    };
    days: string[];
    usualStartTime: string;
    isActive: boolean;
    createdAt: Date;
    // Cached optimal departure info (computed each day and reused)
    cachedOptimalTime?: string;       // ISO string
    cachedAnalysisDate?: string;      // YYYY-MM-DD of when analysis was done
    cachedRouteSummary?: string;      // e.g. "via NH 44"
    cachedDistanceKm?: number;
    cachedDurationText?: string;
    lastNotifiedDate?: string;        // YYYY-MM-DD — so we notify at most once per day
}

export const initDB = () => {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify([]), 'utf-8');
    }
};

const readDB = (): ISchedule[] => {
    try {
        const data = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
};

const writeDB = (data: ISchedule[]) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
};

export const ScheduleModel = {
    find: (query?: Partial<ISchedule>): ISchedule[] => {
        const schedules = readDB();
        if (!query) return schedules;
        return schedules.filter(schedule => {
            for (const [key, value] of Object.entries(query)) {
                if ((schedule as any)[key] !== value) return false;
            }
            return true;
        });
    },

    findById: (id: string): ISchedule | null => {
        const schedules = readDB();
        return schedules.find(s => s._id === id) || null;
    },

    create: (scheduleData: Omit<ISchedule, '_id' | 'createdAt' | 'isActive'>): ISchedule => {
        const schedules = readDB();
        const newSchedule: ISchedule = {
            ...scheduleData,
            _id: Math.random().toString(36).substr(2, 9),
            isActive: true,
            createdAt: new Date()
        };
        schedules.push(newSchedule);
        writeDB(schedules);
        return newSchedule;
    },

    update: (id: string, updates: Partial<ISchedule>): ISchedule | null => {
        const schedules = readDB();
        const index = schedules.findIndex(s => s._id === id);
        if (index === -1) return null;
        schedules[index] = { ...schedules[index], ...updates };
        writeDB(schedules);
        return schedules[index];
    },

    findByIdAndDelete: (id: string): ISchedule | null => {
        const schedules = readDB();
        const index = schedules.findIndex(s => s._id === id);
        if (index === -1) return null;
        const deleted = schedules.splice(index, 1)[0];
        writeDB(schedules);
        return deleted;
    }
};

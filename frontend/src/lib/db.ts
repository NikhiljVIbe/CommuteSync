import fs from 'fs';
import path from 'path';

// For Vercel, we'll try to use /tmp or a local file, but note that it's NOT PERSISTENT.
// In a real app, you'd use a real DB like MongoDB or Vercel KV.
// We'll keep this logic for now so it works similarly to your local setup.
const dbPath = path.join(process.cwd(), 'src/data/schedules.json');

// Ensure directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

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
    cachedOptimalTime?: string;
    cachedAnalysisDate?: string;
    cachedRouteSummary?: string;
    cachedDistanceKm?: number;
    cachedDurationText?: string;
    lastNotifiedDate?: string;
}

const readDB = (): ISchedule[] => {
    try {
        if (!fs.existsSync(dbPath)) return [];
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
                if ((schedule as any)[key] !== (value as any)) {
                    // Primitive check for days array if needed, but usually we filter by email
                    if (Array.isArray(value) && Array.isArray((schedule as any)[key])) {
                        if (JSON.stringify(value) !== JSON.stringify((schedule as any)[key])) return false;
                        continue;
                    }
                    return false;
                }
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

import mongoose from 'mongoose';

export interface ISchedule extends mongoose.Document {
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
    days: string[]; // e.g. ['Monday', 'Tuesday']
    usualStartTime: string; // e.g. '09:00' (24-hour format)
    isActive: boolean;
}

const scheduleSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    source: {
        address: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        placeId: { type: String, required: true },
    },
    destination: {
        address: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        placeId: { type: String, required: true },
    },
    days: [{
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    usualStartTime: {
        type: String, // HH:mm format
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

export const Schedule = mongoose.model<ISchedule>('Schedule', scheduleSchema);

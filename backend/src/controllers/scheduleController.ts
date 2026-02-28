import { Request, Response } from 'express';
import { ScheduleModel } from '../config/db';
import { analyzeOptimalDepartureTime } from '../services/trafficAnalyzer';
import { sendNotificationEmail } from '../services/emailService';

// @desc    Get all schedules for an email
// @route   GET /api/schedules/:email
export const getSchedules = async (req: Request, res: Response) => {
    try {
        const schedules = ScheduleModel.find({ email: req.params.email as string });
        res.json(schedules);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new schedule
// @route   POST /api/schedules
export const createSchedule = async (req: Request, res: Response) => {
    try {
        const { email, source, destination, days, usualStartTime } = req.body;

        if (!email || !source || !destination || !days || !usualStartTime) {
            res.status(400).json({ message: 'Please provide all required fields' });
            return;
        }

        const schedule = ScheduleModel.create({
            email,
            source,
            destination,
            days,
            usualStartTime,
        });

        res.status(201).json(schedule);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Trigger immediate analysis + email for a schedule
// @route   POST /api/schedules/:id/trigger
export const triggerSchedule = async (req: Request, res: Response) => {
    try {
        const schedule = ScheduleModel.findById(req.params.id as string);
        if (!schedule) {
            res.status(404).json({ message: 'Schedule not found' });
            return;
        }

        console.log(`[TRIGGER] Running immediate analysis for ${schedule.email}...`);

        const [hours, minutes] = schedule.usualStartTime.split(':').map(Number);
        const baseDepartureTime = new Date();
        baseDepartureTime.setHours(hours, minutes, 0, 0);

        // If the departure time has already passed today, set it to now + 30 mins
        const now = new Date();
        if (baseDepartureTime.getTime() <= now.getTime()) {
            baseDepartureTime.setTime(now.getTime() + 30 * 60000);
        }

        const { optimalTime, allResults } = await analyzeOptimalDepartureTime(
            schedule.source.placeId,
            schedule.destination.placeId,
            baseDepartureTime
        );

        console.log(`[TRIGGER] Optimal time: ${optimalTime.departureTime.toISOString()}, sending email...`);

        await sendNotificationEmail(
            schedule.email,
            schedule.source.address,
            schedule.destination.address,
            optimalTime,
            allResults
        );

        // Cache the analysis, but don't set lastNotifiedDate so the daily cron still runs
        const today = new Date().toISOString().slice(0, 10);
        ScheduleModel.update(schedule._id, {
            cachedOptimalTime: optimalTime.departureTime.toISOString(),
            cachedAnalysisDate: today,
            cachedRouteSummary: optimalTime.routeSummary,
            cachedDistanceKm: optimalTime.distanceKm,
            cachedDurationText: optimalTime.durationText,
            // lastNotifiedDate: today, <-- Removed this to allow cron to trigger later today
        });

        console.log(`[TRIGGER] Email sent to ${schedule.email} ✓`);
        res.json({ success: true, message: `Analysis complete. Email sent to ${schedule.email}`, optimalTime });
    } catch (error: any) {
        console.error('[TRIGGER] Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a schedule
// @route   DELETE /api/schedules/:id
export const deleteSchedule = async (req: Request, res: Response) => {
    try {
        const schedule = ScheduleModel.findByIdAndDelete(req.params.id as string);
        if (!schedule) {
            res.status(404).json({ message: 'Schedule not found' });
            return;
        }
        res.json({ message: 'Schedule removed' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

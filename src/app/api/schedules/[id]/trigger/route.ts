import { NextRequest, NextResponse } from 'next/server';
import { ScheduleModel } from '@/lib/db';
import { analyzeOptimalDepartureTime } from '@/lib/trafficAnalyzer';
import { sendNotificationEmail } from '@/lib/emailService';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const schedule = ScheduleModel.findById(id);

    if (!schedule) {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    try {
        const [hours, minutes] = schedule.usualStartTime.split(':').map(Number);
        const baseDepartureTime = new Date();
        baseDepartureTime.setHours(hours, minutes, 0, 0);

        // If already passed today, set to now + 30 mins
        const now = new Date();
        if (baseDepartureTime.getTime() <= now.getTime()) {
            baseDepartureTime.setTime(now.getTime() + 30 * 60000);
        }

        const { optimalTime, allResults } = await analyzeOptimalDepartureTime(
            schedule.source.placeId,
            schedule.destination.placeId,
            baseDepartureTime
        );

        await sendNotificationEmail(
            schedule.email,
            schedule.source.address,
            schedule.destination.address,
            optimalTime,
            allResults
        );

        // Update cache
        const today = new Date().toISOString().slice(0, 10);
        ScheduleModel.update(schedule._id, {
            cachedOptimalTime: optimalTime.departureTime.toISOString(),
            cachedAnalysisDate: today,
            cachedRouteSummary: optimalTime.routeSummary,
            cachedDistanceKm: optimalTime.distanceKm,
            cachedDurationText: optimalTime.durationText,
            // lastNotifiedDate: today, // Optionally set if you want to skip later cron
        });

        return NextResponse.json({ success: true, optimalTime });
    } catch (err: any) {
        console.error('Trigger Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

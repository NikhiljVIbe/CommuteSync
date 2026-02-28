import { NextRequest, NextResponse } from 'next/server';
import { ScheduleModel } from '@/lib/db';
import { analyzeOptimalDepartureTime } from '@/lib/trafficAnalyzer';
import { sendNotificationEmail } from '@/lib/emailService';

const todayStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export async function GET(req: NextRequest) {
    // Add authentication check (Vercel Cron Token or simple Secret)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
        return new Response('Unauthorized', { status: 401 });
    }

    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[now.getDay()];
    const today = todayStr();

    const allSchedules = ScheduleModel.find();
    const schedules = allSchedules.filter(s => s.isActive && s.days.includes(todayName));

    console.log(`[Vercel Cron] Running for ${schedules.length} schedules...`);

    for (const schedule of schedules) {
        try {
            const [hours, minutes] = schedule.usualStartTime.split(':').map(Number);
            const usualStartToday = new Date();
            usualStartToday.setHours(hours, minutes, 0, 0);

            const minsUntilUsual = (usualStartToday.getTime() - now.getTime()) / 60000;

            // ── PHASE 1: Proactive Analysis ─────────────────────────────────────
            if (minsUntilUsual <= 150 && schedule.cachedAnalysisDate !== today) {
                console.log(`[ANALYSIS] ${schedule.email}: computing today's optimal...`);
                const { optimalTime } = await analyzeOptimalDepartureTime(
                    schedule.source.placeId,
                    schedule.destination.placeId,
                    usualStartToday
                );

                ScheduleModel.update(schedule._id, {
                    cachedOptimalTime: optimalTime.departureTime.toISOString(),
                    cachedAnalysisDate: today,
                    cachedRouteSummary: optimalTime.routeSummary,
                    cachedDistanceKm: optimalTime.distanceKm,
                    cachedDurationText: optimalTime.durationText,
                });
            }

            // ── PHASE 2: Strict Trigger check ───────────────────────────────────
            const current = ScheduleModel.findById(schedule._id);
            if (!current || current.lastNotifiedDate === today) continue;

            let shouldNotify = false;
            let triggerReason = '';

            if (minsUntilUsual <= 18 && minsUntilUsual >= -30) {
                shouldNotify = true;
                triggerReason = `Window: ${Math.round(minsUntilUsual)}m to usual start`;
            }

            if (!shouldNotify && current.cachedOptimalTime) {
                const optimalTime = new Date(current.cachedOptimalTime);
                const minsUntilOptimal = (optimalTime.getTime() - now.getTime()) / 60000;
                if (minsUntilOptimal <= 18 && minsUntilOptimal >= -30) {
                    shouldNotify = true;
                    triggerReason = `Window: ${Math.round(minsUntilOptimal)}m to optimal departure`;
                }
            }

            if (shouldNotify) {
                console.log(`[TRIGGER] ${schedule.email}: ${triggerReason}`);
                const { optimalTime: finalOptimal, allResults } = await analyzeOptimalDepartureTime(
                    schedule.source.placeId,
                    schedule.destination.placeId,
                    usualStartToday
                );

                await sendNotificationEmail(
                    schedule.email,
                    schedule.source.address,
                    schedule.destination.address,
                    finalOptimal,
                    allResults
                );

                ScheduleModel.update(schedule._id, { lastNotifiedDate: today });
                console.log(`[SUCCESS] Email sent to ${schedule.email}`);
            }
        } catch (err) {
            console.error(`[CRON ERROR] ${schedule.email}:`, err);
        }
    }

    return NextResponse.json({ success: true, processed: schedules.length });
}

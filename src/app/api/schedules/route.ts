import { NextRequest, NextResponse } from 'next/server';
import { ScheduleModel } from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const schedules = ScheduleModel.find({ email });
    return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, source, destination, days, usualStartTime } = body;

        if (!email || !source || !destination || !days || !usualStartTime) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const schedule = ScheduleModel.create({
            email,
            source,
            destination,
            days,
            usualStartTime,
        });

        return NextResponse.json(schedule, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

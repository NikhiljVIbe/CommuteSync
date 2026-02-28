import { NextRequest, NextResponse } from 'next/server';
import { ScheduleModel } from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;

    // Simple heuristic: if it contains '@', it's an email lookup, otherwise it's a single schedule ID
    if (id.includes('@')) {
        const schedules = ScheduleModel.find({ email: id });
        return NextResponse.json(schedules);
    }

    const schedule = ScheduleModel.findById(id);
    if (!schedule) {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json(schedule);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    const deleted = ScheduleModel.findByIdAndDelete(id);

    if (!deleted) {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Schedule removed' });
}

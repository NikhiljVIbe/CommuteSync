import { Request, Response } from 'express';
import { sendNotificationEmail } from '../services/emailService';
import { RouteDurationInfo } from '../services/googleMapsService';

export const testEmail = async (req: Request, res: Response) => {
  try {
    const { to } = req.query;

    if (!to) {
      res.status(400).json({ message: 'Please provide a ?to=email query parameter' });
      return;
    }

    // Build a realistic mock commute for the demo
    const now = new Date();
    const optimalDeparture = new Date(now.getTime() + 15 * 60000); // 15 mins from now

    const optimalTimeInfo: RouteDurationInfo = {
      departureTime: optimalDeparture,
      durationSeconds: 2280, // 38 mins
      durationText: '38 mins',
      routeSummary: 'via Outer Ring Road',
      distanceKm: 12.4,
    };

    // Simulated alternatives
    const allResults: RouteDurationInfo[] = [
      { departureTime: new Date(now.getTime() - 60 * 60000), durationSeconds: 3600, durationText: '60 mins', distanceKm: 12.4 },
      { departureTime: new Date(now.getTime() - 45 * 60000), durationSeconds: 3120, durationText: '52 mins', distanceKm: 12.4 },
      { departureTime: new Date(now.getTime() - 30 * 60000), durationSeconds: 2760, durationText: '46 mins', distanceKm: 12.4 },
      { departureTime: new Date(now.getTime() - 15 * 60000), durationSeconds: 2580, durationText: '43 mins', distanceKm: 12.4 },
      optimalTimeInfo,
      { departureTime: new Date(now.getTime() + 30 * 60000), durationSeconds: 2520, durationText: '42 mins', distanceKm: 12.4 },
      { departureTime: new Date(now.getTime() + 45 * 60000), durationSeconds: 2640, durationText: '44 mins', distanceKm: 12.4 },
      { departureTime: new Date(now.getTime() + 60 * 60000), durationSeconds: 2820, durationText: '47 mins', distanceKm: 12.4 },
    ];

    await sendNotificationEmail(
      to as string,
      'Koramangala, Bangalore, Karnataka, India',
      'MG Road, Bangalore, Karnataka, India',
      optimalTimeInfo,
      allResults
    );

    res.json({ success: true, message: `Test email sent successfully to ${to}` });
  } catch (error: any) {
    console.error('Test email error:', error);
    res.status(500).json({ message: error.message });
  }
};

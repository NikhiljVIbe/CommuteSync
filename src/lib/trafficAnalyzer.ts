import { getTrafficDuration, RouteDurationInfo } from './googleMapsService';

/**
 * Analyzes traffic around baseDepartureTime to find the best window.
 */
export const analyzeOptimalDepartureTime = async (
    originPlaceId: string,
    destinationPlaceId: string,
    baseDepartureTime: Date
): Promise<{ optimalTime: RouteDurationInfo; allResults: RouteDurationInfo[] }> => {
    const results: RouteDurationInfo[] = [];
    const intervals = [
        -60, -45, -30, -15, 0, 15, 30, 45, 60,
        75, 90, 105, 120, 135, 150, 165, 180,
    ];

    const now = new Date();
    let hasFutureInterval = false;

    for (const offset of intervals) {
        const checkTime = new Date(baseDepartureTime.getTime() + offset * 60000);
        if (checkTime <= now) continue;

        hasFutureInterval = true;
        const result = await getTrafficDuration(originPlaceId, destinationPlaceId, checkTime);
        if (result) results.push(result);
    }

    if (!hasFutureInterval || results.length === 0) {
        const immediate = new Date(now.getTime() + 60000);
        const result = await getTrafficDuration(originPlaceId, destinationPlaceId, immediate);
        if (result) results.push(result);
    }

    if (results.length === 0) {
        throw new Error('Could not fetch traffic data');
    }

    const optimalTime = results.reduce((prev, cur) =>
        prev.durationSeconds < cur.durationSeconds ? prev : cur
    );

    return { optimalTime, allResults: results };
};

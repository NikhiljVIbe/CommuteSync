import { getTrafficDuration, RouteDurationInfo } from './googleMapsService';

/**
 * Analyzes traffic -1 to +3 hours around baseDepartureTime (every 15 mins),
 * returns the optimal slot and all results for the email table.
 */
export const analyzeOptimalDepartureTime = async (
    originPlaceId: string,
    destinationPlaceId: string,
    baseDepartureTime: Date
): Promise<{ optimalTime: RouteDurationInfo; allResults: RouteDurationInfo[] }> => {
    const results: RouteDurationInfo[] = [];
    // -60 to +180 minutes in 15-min steps
    const intervals = [
        -60, -45, -30, -15, 0, 15, 30, 45, 60,
        75, 90, 105, 120, 135, 150, 165, 180,
    ];

    const now = new Date();
    let hasFutureInterval = false;

    for (const offset of intervals) {
        const checkTime = new Date(baseDepartureTime.getTime() + offset * 60000);
        // Skip past times
        if (checkTime <= now) continue;

        hasFutureInterval = true;
        const result = await getTrafficDuration(originPlaceId, destinationPlaceId, checkTime);
        if (result) results.push(result);
    }

    // If no future intervals found (e.g. base time was long ago), 
    // try one immediate check for "now + 1 min"
    if (!hasFutureInterval || results.length === 0) {
        console.log('No future intervals found in standard window. Checking immediate departure...');
        const immediate = new Date(now.getTime() + 60000);
        const result = await getTrafficDuration(originPlaceId, destinationPlaceId, immediate);
        if (result) results.push(result);
    }

    if (results.length === 0) {
        throw new Error('Could not fetch traffic data for any time intervals (tried future and immediate)');
    }

    // Best = shortest travel duration
    const optimalTime = results.reduce((prev, cur) =>
        prev.durationSeconds < cur.durationSeconds ? prev : cur
    );

    return { optimalTime, allResults: results };
};

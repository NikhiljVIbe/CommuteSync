import axios from 'axios';

export interface RouteDurationInfo {
    departureTime: Date;
    durationSeconds: number;
    durationText: string;
    routeSummary?: string;
    distanceKm?: number;
}

/**
 * Calls Google Maps Routes API for duration + route info at a specific departure time.
 */
export const getTrafficDuration = async (
    originPlaceId: string,
    destinationPlaceId: string,
    departureTime: Date
): Promise<RouteDurationInfo | null> => {
    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is not configured');

        const requestBody = {
            origin: { placeId: originPlaceId },
            destination: { placeId: destinationPlaceId },
            routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
            travelMode: 'DRIVE',
            departureTime: departureTime.toISOString(),
        };

        const response = await axios.post(
            'https://routes.googleapis.com/directions/v2:computeRoutes',
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask':
                        'routes.duration,routes.distanceMeters,routes.description,routes.legs.distanceMeters',
                },
            }
        );

        const routes = response.data.routes;
        if (routes && routes.length > 0) {
            const route = routes[0];
            const durationSeconds = route.duration ? parseInt(route.duration, 10) : null;
            const distanceMeters = route.distanceMeters || null;

            if (durationSeconds === null) return null;

            return {
                departureTime,
                durationSeconds,
                durationText: `${Math.round(durationSeconds / 60)} mins`,
                routeSummary: route.description || undefined,
                distanceKm: distanceMeters ? Math.round(distanceMeters / 100) / 10 : undefined,
            };
        }

        return null;
    } catch (error: any) {
        console.error('Error fetching traffic duration:', error.response?.data || error.message);
        return null;
    }
};

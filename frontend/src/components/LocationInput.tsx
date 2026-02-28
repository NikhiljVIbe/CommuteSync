'use client';

import { useState } from 'react';
import { StandaloneSearchBox, LoadScript } from '@react-google-maps/api';

const libraries: "places"[] = ["places"];

interface PlaceResult {
    address: string;
    lat: number;
    lng: number;
    placeId: string;
}

interface LocationInputProps {
    label: string;
    placeholder: string;
    onPlaceSelected: (place: PlaceResult) => void;
}

export default function LocationInput({ label, placeholder, onPlaceSelected }: LocationInputProps) {
    const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);

    const onLoad = (ref: google.maps.places.SearchBox) => {
        setSearchBox(ref);
    };

    const onPlacesChanged = () => {
        if (searchBox) {
            const places = searchBox.getPlaces();
            if (places && places.length > 0) {
                const place = places[0];
                if (place.geometry?.location && place.place_id && place.formatted_address) {
                    onPlaceSelected({
                        address: place.formatted_address,
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        placeId: place.place_id,
                    });
                }
            }
        }
    };

    // We only load the script once at the app level usually, but for simplicity we can load it here if not loaded.
    // Better approach is to wrap the whole app in LoadScript or useJsApiLoader
    return (
        <div className="flex flex-col space-y-1 mb-4">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <StandaloneSearchBox
                onLoad={onLoad}
                onPlacesChanged={onPlacesChanged}
            >
                <input
                    type="text"
                    placeholder={placeholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </StandaloneSearchBox>
        </div>
    );
}

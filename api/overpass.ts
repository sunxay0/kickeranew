import { Field, SurfaceType } from '../types';
import { generateMockFieldDetails } from '../mockData';
import L from 'leaflet';

// Implemented a fallback mechanism with multiple endpoints for resilience.
const OVERPASS_ENDPOINTS = [
  "https://lz4.overpass-api.de/api/interpreter",   // Primary
  "https://z.overpass-api.de/api/interpreter",     // Fallback 1
  "https://overpass-api.de/api/interpreter",     // Fallback 2 (often busy)
];


// Overpass API returns elements that need to be mapped to our Field type.
interface OverpassElement {
    type: 'node' | 'way' | 'relation';
    id: number;
    lat?: number;
    lon?: number;
    center?: {
        lat: number;
        lon: number;
    };
    tags?: {
        name?: string;
        surface?: string;
        lit?: 'yes' | 'no';
        sport?: string;
    };
}

const mapSurface = (surface?: string): SurfaceType => {
    switch (surface) {
        case 'grass':
        case 'natural_grass':
            return SurfaceType.Grass;
        case 'artificial_turf':
        case 'artificial':
            return SurfaceType.Artificial;
        case 'concrete':
            return SurfaceType.Concrete;
        case 'asphalt':
            return SurfaceType.Asphalt;
        default:
            return SurfaceType.Artificial; // Default fallback
    }
}


export const fetchFootballFields = async (center: L.LatLng, radius: number): Promise<Field[]> => {
    const aroundSpec = `(around:${radius},${center.lat},${center.lng})`;
    // Comprehensive query to find football pitches and stadiums within a radius.
    const query = `
        [out:json][timeout:25];
        (
          // Find standard pitches for soccer/football
          node["sport"~"soccer|football"]${aroundSpec};
          way["sport"~"soccer|football"]${aroundSpec};
          relation["sport"~"soccer|football"]${aroundSpec};

          // Find multi-sport pitches
          node["leisure"="pitch"]["sport"~"multi"]${aroundSpec};
          way["leisure"="pitch"]["sport"~"multi"]${aroundSpec};
          relation["leisure"="pitch"]["sport"~"multi"]${aroundSpec};

          // Find stadiums by leisure tag
          node["leisure"="stadium"]${aroundSpec};
          way["leisure"="stadium"]${aroundSpec};
          relation["leisure"="stadium"]${aroundSpec};

          // Find stadiums by building tag
          node["building"="stadium"]${aroundSpec};
          way["building"="stadium"]${aroundSpec};
          relation["building"="stadium"]${aroundSpec};
        );
        out center;
    `;

    let lastError: Error | null = null;

    for (const endpoint of OVERPASS_ENDPOINTS) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: `data=${encodeURIComponent(query)}`
            });

            if (!response.ok) {
                lastError = new Error(`Overpass API error from ${endpoint}: ${response.statusText}`);
                console.warn(lastError.message);
                continue; // Try the next endpoint
            }

            const data: { elements: OverpassElement[] } = await response.json();
            
            const fields: Field[] = data.elements.map((element) => {
                const name = element.tags?.name || 'Football Venue';
                const baseDetails = generateMockFieldDetails(element.id, name);
                
                // Override generated details with real data if available
                baseDetails.surface = mapSurface(element.tags?.surface);
                baseDetails.lighting = element.tags?.lit === 'yes';

                const field: Field = {
                    id: element.id,
                    name: name,
                    lat: element.lat || element.center!.lat,
                    lng: element.lon || element.center!.lon,
                    ...baseDetails
                };
                return field;
            });
            
            console.log(`Successfully fetched fields from ${endpoint}`);
            return fields; // Success, exit the function
        } catch (error) {
            lastError = error as Error;
            console.warn(`Failed to connect to ${endpoint}:`, error);
            // Loop will continue to the next endpoint
        }
    }

    // If the loop completes, all endpoints have failed.
    console.error("All Overpass API endpoints failed.", lastError);
    throw new Error("Failed to fetch from Overpass API"); // Throw a generic error for the UI to handle
};
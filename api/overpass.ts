import L from 'leaflet';
import { Field, SurfaceType } from '../types';
import { generateMockFieldDetails } from '../mockData';

// Implemented a fallback mechanism with multiple endpoints for resilience.
const OVERPASS_ENDPOINTS = [
  "https://lz4.overpass-api.de/api/interpreter",   // Primary
  "https://z.overpass-api.de/api/interpreter",     // Fallback 1
  "https://overpass-api.de/api/interpreter",     // Fallback 2 (often busy)
];

const PIXABAY_API_KEY = '52832860-1c28bc836ec1fa43bd588779b';

async function fetchFootballImages(): Promise<string[]> {
    const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent("football stadium")}&image_type=photo&per_page=50&safesearch=true&category=places,sports`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Pixabay API error: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.hits && data.hits.length > 0) {
            console.log('Successfully fetched images from Pixabay.');
            return data.hits.map((hit: any) => hit.largeImageURL);
        }
        console.warn('Pixabay API returned no images.');
        return [];
    } catch (error) {
        console.warn('Failed to fetch from Pixabay API:', error);
        return [];
    }
}


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
        image?: string;
    };
}

const mapSurface = (surface?: string): SurfaceType => {
    switch (surface) {
        case 'grass':
        case 'natural_grass':
            return SurfaceType.Grass;
        case 'artificial_turf':
        case 'artificial':
            return SurfaceType.Rubber;
        case 'concrete':
            return SurfaceType.Hall;
        case 'asphalt':
            return SurfaceType.Asphalt;
        case 'sand':
            return SurfaceType.Sand;
        default:
            return SurfaceType.Rubber; // Default fallback
    }
}


export const fetchFootballFields = async (center: L.LatLng, radius: number): Promise<{fields: Field[], images: string[]}> => {
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

          // Find sand pitches
          node["surface"="sand"]${aroundSpec};
          way["surface"="sand"]${aroundSpec};
          relation["surface"="sand"]${aroundSpec};
        );
        out center;
    `;
    
    const images = await fetchFootballImages();
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

                // Assign a random photo from the Pixabay list, or an empty string if none are available.
                const photoUrl = images.length > 0 ? images[Math.floor(Math.random() * images.length)] : '';

                const field: Field = {
                    ...baseDetails,
                    id: element.id,
                    name: name,
                    lat: element.lat || element.center!.lat,
                    lng: element.lon || element.center!.lon,
                    photo: photoUrl,
                };
                return field;
            });
            
            console.log(`Successfully fetched fields from ${endpoint}`);
            return { fields, images }; // Success, exit the function
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
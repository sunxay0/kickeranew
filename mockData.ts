import { Field, FieldStatus, SurfaceType } from './types';

export const generateMockFieldDetails = (id: number, name: string): Omit<Field, 'id' | 'name' | 'lat' | 'lng'> => {
    const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
    const surfaces: SurfaceType[] = Object.values(SurfaceType);

    return {
        status: FieldStatus.Available,
        surface: surfaces[id % surfaces.length],
        lighting: false,
        rating: 0,
        photo: '', // This will be overwritten by the Overpass API logic
        players: [],
        reviews: [],
        // chat: [], // Chat is now a subcollection
        tournaments: [],
        size: sizes[id % sizes.length],
    };
};
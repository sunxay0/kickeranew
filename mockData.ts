import { Field, FieldStatus, SurfaceType } from './types';

export const generateMockFieldDetails = (id: number, name: string): Omit<Field, 'id' | 'name' | 'lat' | 'lng'> => {
    return {
        status: FieldStatus.Available,
        surface: SurfaceType.Artificial, // Default value, no more randomness
        lighting: false, // Default value, no more randomness
        rating: 0, // New fields start with 0 rating
        photo: `https://source.unsplash.com/800x600/?soccer,stadium,pitch&sig=${id}`,
        players: [],
        reviews: [],
        chat: [],
        tournaments: [],
    };
};
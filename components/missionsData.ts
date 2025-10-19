import { Mission } from '../types';

// Helpers for expiration dates
const endOfToday = () => new Date(new Date().setHours(23, 59, 59, 999)).toISOString();
const endOfWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // Sunday - 0, Monday - 1, ...
    const end = new Date(now);
    // Set to next Sunday
    end.setDate(now.getDate() + (7 - (dayOfWeek === 0 ? 7 : dayOfWeek)));
    end.setHours(23, 59, 59, 999);
    return end.toISOString();
};
const permanent = () => new Date('2099-12-31T23:59:59Z').toISOString();

const gameMissions: { value: number; title: string; description: string; rewards: { experience: number; points?: number; items?: string[] } }[] = [
    { value: 1, title: 'Первый шаг', description: 'Сыграй свою первую игру.', rewards: { experience: 100, points: 20 } },
    { value: 3, title: 'Разминка', description: 'Сыграй 3 игры.', rewards: { experience: 120, points: 25 } },
    { value: 5, title: 'Начинающий', description: 'Сыграй 5 игр.', rewards: { experience: 150, points: 30 } },
    { value: 10, title: 'Любитель', description: 'Сыграй 10 игр.', rewards: { experience: 200, points: 40 } },
    { value: 25, title: 'Постоялец', description: 'Сыграй 25 игр.', rewards: { experience: 300, points: 60, items: ['Карточка "Постоялец"'] } },
    { value: 50, title: 'Энтузиаст', description: 'Сыграй 50 игр.', rewards: { experience: 500, points: 100 } },
    { value: 75, title: 'Увлеченный', description: 'Сыграй 75 игр.', rewards: { experience: 600, points: 120 } },
    { value: 100, title: 'Ветеран', description: 'Сыграй 100 игр.', rewards: { experience: 1000, points: 200, items: ['Карточка "Ветеран"'] } },
    { value: 150, title: 'Профи', description: 'Сыграй 150 игр.', rewards: { experience: 1200, points: 240 } },
    { value: 200, title: 'Мастер', description: 'Сыграй 200 игр.', rewards: { experience: 1500, points: 300 } },
    { value: 250, title: 'Гуру', description: 'Сыграй 250 игр.', rewards: { experience: 2000, points: 400, items: ['Карточка "Гуру"'] } },
    { value: 300, title: 'Чемпион', description: 'Сыграй 300 игр.', rewards: { experience: 2500, points: 500 } },
    { value: 400, title: 'Завоеватель', description: 'Сыграй 400 игр.', rewards: { experience: 3000, points: 600 } },
    { value: 500, title: 'Легенда коробки', description: 'Сыграй 500 игр.', rewards: { experience: 5000, points: 1000, items: ['Легендарная карточка'] } },
    { value: 750, title: 'Повелитель мяча', description: 'Сыграй 750 игр.', rewards: { experience: 7500, points: 1500 } },
    { value: 1000, title: 'Икона улиц', description: 'Сыграй 1000 игр.', rewards: { experience: 10000, points: 2000, items: ['Карточка "Икона"'] } },
];

const fieldMissions: { value: number; title: string; description: string; rewards: { experience: number; points?: number; items?: string[] } }[] = [
    { value: 1, title: 'На разведку', description: 'Посети своё первое поле.', rewards: { experience: 100, points: 20 } },
    { value: 3, title: 'Знакомство с районом', description: 'Посети 3 разных поля.', rewards: { experience: 150, points: 30 } },
    { value: 5, title: 'Турист', description: 'Посети 5 разных полей.', rewards: { experience: 200, points: 40 } },
    { value: 10, title: 'Путешественник', description: 'Посети 10 разных полей.', rewards: { experience: 300, points: 60, items: ['Карточка "Странник"'] } },
    { value: 20, title: 'Исследователь', description: 'Посети 20 разных полей.', rewards: { experience: 400, points: 80 } },
    { value: 30, title: 'Первооткрыватель', description: 'Посети 30 разных полей.', rewards: { experience: 500, points: 100 } },
    { value: 50, title: 'Картограф', description: 'Посети 50 разных полей.', rewards: { experience: 1000, points: 200, items: ['Карточка "Картограф"'] } },
    { value: 75, title: 'Кочевник', description: 'Посети 75 разных полей.', rewards: { experience: 1500, points: 300 } },
    { value: 100, title: 'Коллекционер полей', description: 'Посети 100 разных полей.', rewards: { experience: 2500, points: 500, items: ['Карточка "Коллекционер"'] } },
];

const friendMissions: { value: number; title: string; description: string; rewards: { experience: number; points?: number; items?: string[] } }[] = [
    { value: 1, title: 'Первый друг', description: 'Добавь 1 друга.', rewards: { experience: 100, points: 20 } },
    { value: 5, title: 'Своя компания', description: 'Собери 5 друзей.', rewards: { experience: 150, points: 30 } },
    { value: 10, title: 'Своя команда', description: 'Собери команду из 10 друзей.', rewards: { experience: 250, points: 50, items: ['Карточка "Командный игрок"'] } },
    { value: 20, title: 'Душа компании', description: 'Добавь в друзья 20 человек.', rewards: { experience: 350, points: 70 } },
    { value: 30, title: 'Центр внимания', description: 'Собери 30 друзей.', rewards: { experience: 500, points: 100 } },
    { value: 50, title: 'Лидер мнений', description: 'Собери 50 друзей.', rewards: { experience: 1000, points: 200, items: ['Карточка "Лидер"'] } },
    { value: 75, title: 'Организатор', description: 'Добавь в друзья 75 человек.', rewards: { experience: 1500, points: 300 } },
    { value: 100, title: 'Легенда сообщества', description: 'Добавь в друзья 100 человек.', rewards: { experience: 2500, points: 500, items: ['Карточка "Легенда"'] } },
];

const reviewMissions: { value: number; title: string; description: string; rewards: { experience: number; points?: number; items?: string[] } }[] = [
    { value: 1, title: 'Первое мнение', description: 'Оставь свой первый отзыв.', rewards: { experience: 100, points: 20 } },
    { value: 5, title: 'Начинающий критик', description: 'Оставь 5 отзывов.', rewards: { experience: 150, points: 30 } },
    { value: 10, title: 'Обозреватель', description: 'Оставь 10 отзывов.', rewards: { experience: 250, points: 50, items: ['Карточка "Ревизор"'] } },
    { value: 20, title: 'Опытный рецензент', description: 'Оставь 20 отзывов.', rewards: { experience: 350, points: 70 } },
    { value: 30, title: 'Инспектор полей', description: 'Оставь 30 отзывов.', rewards: { experience: 500, points: 100 } },
    { value: 50, title: 'Главный по полям', description: 'Оставь 50 отзывов.', rewards: { experience: 1000, points: 200, items: ['Карточка "Инспектор"'] } },
    { value: 75, title: 'Амбассадор качества', description: 'Оставь 75 отзывов.', rewards: { experience: 1500, points: 300 } },
    { value: 100, title: 'Хранитель знаний', description: 'Оставь 100 отзывов.', rewards: { experience: 2500, points: 500, items: ['Карточка "Хранитель"'] } },
];

const createChainMissions = (type: 'games_played' | 'fields_visited' | 'friends_count' | 'reviews_left', source: { value: number; title: string; description: string; rewards: { experience: number; points?: number; items?: string[] } }[]): Mission[] => {
    return source.map(m => ({
        id: `${type}_${m.value}`,
        title: m.title,
        description: m.description,
        type: 'special',
        requirements: [{ type, value: m.value, current: 0 }],
        rewards: m.rewards,
        isCompleted: false,
        expiresAt: permanent()
    }));
};

export const missionsList: Mission[] = [
    // --- Daily ---
    {
        id: 'daily_game_1', title: 'Разминка', description: 'Сыграйте 1 игру сегодня.', type: 'daily',
        requirements: [{ type: 'games_played', value: 1, current: 0 }], rewards: { experience: 50, points: 10 },
        isCompleted: false, expiresAt: endOfToday()
    },
    {
        id: 'daily_review_1', title: 'Свежий взгляд', description: 'Оставьте 1 отзыв о поле.', type: 'daily',
        requirements: [{ type: 'reviews_left', value: 1, current: 0 }], rewards: { experience: 75, points: 5 },
        isCompleted: false, expiresAt: endOfToday()
    },
    {
        id: 'daily_game_3', title: 'Игровой день', description: 'Сыграйте 3 игры сегодня.', type: 'daily',
        requirements: [{ type: 'games_played', value: 3, current: 0 }], rewards: { experience: 150, points: 30 },
        isCompleted: false, expiresAt: endOfToday()
    },
    
    // --- Weekly ---
    {
        id: 'weekly_games_7', title: 'Недельный забег', description: 'Сыграйте 7 игр за неделю.', type: 'weekly',
        requirements: [{ type: 'games_played', value: 7, current: 0 }], rewards: { experience: 250, points: 50 },
        isCompleted: false, expiresAt: endOfWeek()
    },
    {
        id: 'weekly_fields_3', title: 'Исследователь недели', description: 'Посетите 3 разных поля.', type: 'weekly',
        requirements: [{ type: 'fields_visited', value: 3, current: 0 }], rewards: { experience: 200, points: 40 },
        isCompleted: false, expiresAt: endOfWeek()
    },
    {
        id: 'weekly_reviews_3', title: 'Еженедельный отчет', description: 'Оставьте 3 отзыва за неделю.', type: 'weekly',
        requirements: [{ type: 'reviews_left', value: 3, current: 0 }], rewards: { experience: 150, points: 30 },
        isCompleted: false, expiresAt: endOfWeek()
    },

    // --- Special - Combined ---
    {
        id: 'combo_1_social_start',
        title: 'Первые шаги в сообществе', description: 'Добавьте 3 друзей и оставьте 3 отзыва.', type: 'special',
        requirements: [
            { type: 'friends_count', value: 3, current: 0 },
            { type: 'reviews_left', value: 3, current: 0 }
        ], rewards: { experience: 200, points: 40 }, isCompleted: false, expiresAt: permanent()
    },
    {
        id: 'combo_2_active_player',
        title: 'Активный игрок', description: 'Сыграйте 10 игр и посетите 5 полей.', type: 'special',
        requirements: [
            { type: 'games_played', value: 10, current: 0 },
            { type: 'fields_visited', value: 5, current: 0 }
        ], rewards: { experience: 300, points: 60 }, isCompleted: false, expiresAt: permanent()
    },
    {
        id: 'combo_3_community_builder',
        title: 'Строитель сообщества', description: 'Добавьте 10 друзей и оставьте 10 отзывов.', type: 'special',
        requirements: [
            { type: 'friends_count', value: 10, current: 0 },
            { type: 'reviews_left', value: 10, current: 0 }
        ], rewards: { experience: 500, points: 100 }, isCompleted: false, expiresAt: permanent()
    },
    {
        id: 'combo_4_all_rounder',
        title: 'Универсал', description: 'Сыграйте 20 игр, посетите 10 полей и добавьте 5 друзей.', type: 'special',
        requirements: [
            { type: 'games_played', value: 20, current: 0 },
            { type: 'fields_visited', value: 10, current: 0 },
            { type: 'friends_count', value: 5, current: 0 }
        ], rewards: { experience: 750, points: 150, items: ['Карточка "Универсал"'] }, isCompleted: false, expiresAt: permanent()
    },
    {
        id: 'combo_5_true_fan',
        title: 'Настоящий фанат', description: 'Сыграйте 50 игр и оставьте 25 отзывов.', type: 'special',
        requirements: [
            { type: 'games_played', value: 50, current: 0 },
            { type: 'reviews_left', value: 25, current: 0 }
        ], rewards: { experience: 1200, points: 250 }, isCompleted: false, expiresAt: permanent()
    },

    // --- Special - Chains ---
    ...createChainMissions('games_played', gameMissions),
    ...createChainMissions('fields_visited', fieldMissions),
    ...createChainMissions('friends_count', friendMissions),
    ...createChainMissions('reviews_left', reviewMissions),

    // --- High Tier Missions ---
    {
        id: 'legend_1_ultimate_player',
        title: 'Легендарное испытание', description: 'Сыграйте 1000 игр, посетите 100 полей, соберите 100 друзей и оставьте 100 отзывов.', type: 'special',
        requirements: [
            { type: 'games_played', value: 1000, current: 0 },
            { type: 'fields_visited', value: 100, current: 0 },
            { type: 'friends_count', value: 100, current: 0 },
            { type: 'reviews_left', value: 100, current: 0 }
        ], rewards: { experience: 20000, points: 5000, items: ['Эксклюзивная карточка Легенды'] }, isCompleted: false, expiresAt: permanent()
    },
];

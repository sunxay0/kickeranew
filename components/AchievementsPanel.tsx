import React, { useState, useEffect } from 'react';
import { Achievement, Player } from '../types';
import { StarIcon, TrophyIcon, UsersIcon, MapIcon, ChatBubbleIcon, HeartIcon } from './icons';

interface AchievementsPanelProps {
  player: Player;
  onUpdatePlayer: (player: Player) => void;
}

export const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ player, onUpdatePlayer }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'games' | 'fields' | 'reviews' | 'social' | 'special'>('all');

  useEffect(() => {
    // Загружаем достижения
    const mockAchievements: Achievement[] = [
      {
        id: 'first_game',
        name: 'Первая игра',
        description: 'Сыграйте свою первую игру',
        icon: '⚽',
        category: 'games',
        requirement: { type: 'games_played', value: 1 },
        reward: { experience: 100 },
        rarity: 'common'
      },
      {
        id: 'field_explorer',
        name: 'Исследователь полей',
        description: 'Посетите 5 разных полей',
        icon: '🗺️',
        category: 'fields',
        requirement: { type: 'fields_visited', value: 5 },
        reward: { experience: 200 },
        rarity: 'rare'
      },
      {
        id: 'social_butterfly',
        name: 'Социальная бабочка',
        description: 'Добавьте 10 друзей',
        icon: '👥',
        category: 'social',
        requirement: { type: 'friends_count', value: 10 },
        reward: { experience: 300 },
        rarity: 'epic'
      },
      {
        id: 'reviewer',
        name: 'Критик',
        description: 'Оставьте 20 отзывов',
        icon: '⭐',
        category: 'reviews',
        requirement: { type: 'reviews_left', value: 20 },
        reward: { experience: 250 },
        rarity: 'rare'
      },
      {
        id: 'veteran',
        name: 'Ветеран',
        description: 'Сыграйте 100 игр',
        icon: '🏆',
        category: 'games',
        requirement: { type: 'games_played', value: 100 },
        reward: { experience: 1000 },
        rarity: 'legendary'
      }
    ];

    setAchievements(mockAchievements);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'games':
        return <TrophyIcon className="w-5 h-5" />;
      case 'fields':
        return <MapIcon className="w-5 h-5" />;
      case 'reviews':
        return <StarIcon className="w-5 h-5" />;
      case 'social':
        return <UsersIcon className="w-5 h-5" />;
      case 'special':
        return <HeartIcon className="w-5 h-5" />;
      default:
        return <TrophyIcon className="w-5 h-5" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-400 bg-gray-100 dark:bg-gray-800';
      case 'rare':
        return 'border-blue-400 bg-blue-100 dark:bg-blue-900/20';
      case 'epic':
        return 'border-purple-400 bg-purple-100 dark:bg-purple-900/20';
      case 'legendary':
        return 'border-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'border-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  };

  const isAchievementUnlocked = (achievement: Achievement) => {
    return player.achievements.includes(achievement.id);
  };

  const getProgress = (achievement: Achievement) => {
    switch (achievement.requirement.type) {
      case 'games_played':
        return Math.min(player.stats.gamesPlayed, achievement.requirement.value);
      case 'fields_visited':
        return Math.min(player.stats.fieldsVisited, achievement.requirement.value);
      case 'reviews_left':
        return Math.min(player.stats.reviewsLeft, achievement.requirement.value);
      case 'friends_count':
        return Math.min(player.friends.length, achievement.requirement.value);
      default:
        return 0;
    }
  };

  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  );

  return (
    <div className="h-full flex flex-col">
      {/* Категории */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            selectedCategory === 'all' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Все
        </button>
        <button
          onClick={() => setSelectedCategory('games')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            selectedCategory === 'games' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Игры
        </button>
        <button
          onClick={() => setSelectedCategory('fields')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            selectedCategory === 'fields' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Поля
        </button>
        <button
          onClick={() => setSelectedCategory('social')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            selectedCategory === 'social' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Социальные
        </button>
      </div>

      {/* Список достижений */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-4">
          {filteredAchievements.map(achievement => {
            const isUnlocked = isAchievementUnlocked(achievement);
            const progress = getProgress(achievement);
            const progressPercent = (progress / achievement.requirement.value) * 100;

            return (
              <div
                key={achievement.id}
                className={`border-2 rounded-lg p-4 transition-all ${
                  isUnlocked 
                    ? `${getRarityColor(achievement.rarity)} opacity-100` 
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {achievement.name}
                      </h3>
                      {isUnlocked && (
                        <span className="text-green-500 text-sm">✓ Получено</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {achievement.description}
                    </p>
                    
                    {/* Прогресс */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Прогресс</span>
                        <span>{progress} / {achievement.requirement.value}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Награда */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <StarIcon className="w-4 h-4" />
                      <span>+{achievement.reward.experience} опыта</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

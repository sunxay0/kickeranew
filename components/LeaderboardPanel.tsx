import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, Player } from '../types';
import { TrophyIcon, StarIcon, UsersIcon, MapIcon } from './icons';

interface LeaderboardPanelProps {
  currentPlayer: Player;
}

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({ currentPlayer }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'games' | 'wins' | 'achievements' | 'organizers'>('games');
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Симуляция загрузки рейтингов
    const loadLeaderboard = async () => {
      setIsLoading(true);
      
      // Генерируем моковые данные
      const mockPlayers: Player[] = [
        {
          id: '1',
          name: 'Алексей Петров',
          handle: 'alexey',
          email: 'alexey@example.com',
          avatar: 'https://i.pravatar.cc/150?u=alexey',
          joinDate: '2024-01-15',
          stats: { gamesPlayed: 150, fieldsVisited: 25, reviewsLeft: 45 },
          authProvider: 'email',
          favoriteFields: [],
          friends: [],
          friendRequestsSent: [],
          friendRequestsReceived: [],
          currentFieldId: null,
          rating: 95,
          level: 15,
          experience: 2500,
          achievements: ['first_game', 'field_explorer'],
          playerCard: {
            id: 'card1',
            playerId: '1',
            rarity: 'gold',
            overallRating: 95,
            characteristics: {
              speed: 90,
              shooting: 95,
              passing: 88,
              defending: 85,
              stamina: 92,
              technique: 93
            },
            specialAbilities: ['Точный удар', 'Лидер команды'],
            isSpecial: false
          }
        },
        {
          id: '2',
          name: 'Мария Сидорова',
          handle: 'maria',
          email: 'maria@example.com',
          avatar: 'https://i.pravatar.cc/150?u=maria',
          joinDate: '2024-02-20',
          stats: { gamesPlayed: 120, fieldsVisited: 18, reviewsLeft: 30 },
          authProvider: 'email',
          favoriteFields: [],
          friends: [],
          friendRequestsSent: [],
          friendRequestsReceived: [],
          currentFieldId: null,
          rating: 88,
          level: 12,
          experience: 1800,
          achievements: ['first_game'],
          playerCard: {
            id: 'card2',
            playerId: '2',
            rarity: 'silver',
            overallRating: 88,
            characteristics: {
              speed: 85,
              shooting: 90,
              passing: 92,
              defending: 80,
              stamina: 85,
              technique: 88
            },
            specialAbilities: ['Быстрая передача'],
            isSpecial: false
          }
        },
        {
          id: '3',
          name: 'Дмитрий Козлов',
          handle: 'dmitry',
          email: 'dmitry@example.com',
          avatar: 'https://i.pravatar.cc/150?u=dmitry',
          joinDate: '2024-03-10',
          stats: { gamesPlayed: 80, fieldsVisited: 12, reviewsLeft: 20 },
          authProvider: 'email',
          favoriteFields: [],
          friends: [],
          friendRequestsSent: [],
          friendRequestsReceived: [],
          currentFieldId: null,
          rating: 75,
          level: 8,
          experience: 1200,
          achievements: ['first_game'],
          playerCard: {
            id: 'card3',
            playerId: '3',
            rarity: 'bronze',
            overallRating: 75,
            characteristics: {
              speed: 70,
              shooting: 80,
              passing: 75,
              defending: 85,
              stamina: 70,
              technique: 72
            },
            specialAbilities: [],
            isSpecial: false
          }
        }
      ];

      const mockLeaderboard: LeaderboardEntry[] = mockPlayers.map((player, index) => ({
        player,
        rank: index + 1,
        score: player.stats.gamesPlayed,
        category: selectedCategory
      }));

      setTimeout(() => {
        setLeaderboard(mockLeaderboard);
        setIsLoading(false);
      }, 1000);
    };

    loadLeaderboard();
  }, [selectedCategory, selectedPeriod]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'games':
        return <TrophyIcon className="w-5 h-5" />;
      case 'wins':
        return <StarIcon className="w-5 h-5" />;
      case 'achievements':
        return <UsersIcon className="w-5 h-5" />;
      case 'organizers':
        return <MapIcon className="w-5 h-5" />;
      default:
        return <TrophyIcon className="w-5 h-5" />;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'games':
        return 'Количество игр';
      case 'wins':
        return 'Победы';
      case 'achievements':
        return 'Достижения';
      case 'organizers':
        return 'Организаторы турниров';
      default:
        return 'Рейтинг';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-500';
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-500">Загрузка рейтингов...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Категории */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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
          onClick={() => setSelectedCategory('wins')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            selectedCategory === 'wins' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Победы
        </button>
        <button
          onClick={() => setSelectedCategory('achievements')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            selectedCategory === 'achievements' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Достижения
        </button>
        <button
          onClick={() => setSelectedCategory('organizers')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            selectedCategory === 'organizers' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Организаторы
        </button>
      </div>

      {/* Период */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={() => setSelectedPeriod('monthly')}
          className={`flex-1 p-2 text-sm font-medium transition-colors ${
            selectedPeriod === 'monthly' 
              ? 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Месячный
        </button>
        <button
          onClick={() => setSelectedPeriod('yearly')}
          className={`flex-1 p-2 text-sm font-medium transition-colors ${
            selectedPeriod === 'yearly' 
              ? 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Годовой
        </button>
      </div>

      {/* Список рейтингов */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {getCategoryTitle(selectedCategory)} - {selectedPeriod === 'monthly' ? 'Месяц' : 'Год'}
          </h3>
          
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.player.id}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                  entry.player.id === currentPlayer.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                {/* Ранг */}
                <div className={`text-2xl font-bold ${getRankColor(entry.rank)}`}>
                  {getRankIcon(entry.rank)}
                </div>

                {/* Аватар */}
                <img 
                  src={entry.player.avatar} 
                  alt={entry.player.name}
                  className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600"
                />

                {/* Информация */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {entry.player.name}
                    </h4>
                    {entry.player.id === currentPlayer.id && (
                      <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                        Вы
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Уровень {entry.player.level}</span>
                    <span>Рейтинг {entry.player.rating}</span>
                    <span>{entry.score} {getCategoryTitle(selectedCategory).toLowerCase()}</span>
                  </div>
                </div>

                {/* Очки */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {entry.score}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getCategoryTitle(selectedCategory)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


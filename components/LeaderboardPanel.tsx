import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, Player } from '../types';
import { TrophyIcon, StarIcon, UsersIcon, MapIcon, LoadingSpinner } from './icons';
import { db } from '../firebase';
import type firebase from 'firebase/compat/app';

interface LeaderboardPanelProps {
  currentPlayer: Player;
}

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({ currentPlayer }) => {
  // FIX: Simplified the state type as LeaderboardEntry now correctly defines the rank type.
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'games' | 'wins' | 'achievements' | 'organizers'>('games');
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoading(true);
      setLeaderboard([]);

      try {
        let fieldToOrderBy: string;
        let scoreField: (player: Player) => number;
        let query: firebase.firestore.Query;

        switch (selectedCategory) {
          case 'games':
            fieldToOrderBy = 'stats.gamesPlayed';
            scoreField = player => player.stats.gamesPlayed;
            break;
          case 'achievements':
            // Firestore can't order by array length, using level as a proxy.
            fieldToOrderBy = 'level';
            scoreField = player => player.level;
            break;
          case 'wins':
            // No 'wins' field, using overall rating as a proxy.
            fieldToOrderBy = 'rating';
            scoreField = player => player.rating;
            break;
          case 'organizers':
            // No 'organizer' field, using fields visited as a proxy.
            fieldToOrderBy = 'stats.fieldsVisited';
            scoreField = player => player.stats.fieldsVisited;
            break;
          default:
            fieldToOrderBy = 'stats.gamesPlayed';
            scoreField = player => player.stats.gamesPlayed;
        }
        
        query = db.collection('users')
          .orderBy(fieldToOrderBy, 'desc')
          .limit(10);
        
        const snapshot = await query.get();
        const topPlayers = snapshot.docs.map(doc => doc.data() as Player);

        // FIX: Simplified the type as LeaderboardEntry now correctly defines the rank type.
        const leaderboardEntries: LeaderboardEntry[] = topPlayers.map((player, index) => ({
          player,
          rank: index + 1,
          score: scoreField(player),
          category: selectedCategory,
        }));
        
        const currentUserInTop = leaderboardEntries.some(entry => entry.player.id === currentPlayer.id);
        
        if (!currentUserInTop && scoreField(currentPlayer) > 0) {
            leaderboardEntries.push({
            player: currentPlayer,
            rank: '...',
            score: scoreField(currentPlayer),
            category: selectedCategory
          });
        }

        setLeaderboard(leaderboardEntries);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, [selectedCategory, selectedPeriod, currentPlayer]);

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
        return 'Рейтинг';
      case 'achievements':
        return 'Уровень';
      case 'organizers':
        return 'Посещено полей';
      default:
        return 'Рейтинг';
    }
  };

  const getRankIcon = (rank: number | string) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number | string) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-500';
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <LoadingSpinner className="w-12 h-12 text-indigo-600" />
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
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
                  </div>
                </div>

                {/* Очки */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {entry.score}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getCategoryTitle(selectedCategory).toLowerCase()}
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
import React, { useState, useEffect } from 'react';
import { Mission, Player } from '../types';
import { ClockIcon, StarIcon, TrophyIcon, GiftIcon } from './icons';

interface MissionsPanelProps {
  player: Player;
  onUpdatePlayer: (player: Player) => void;
}

export const MissionsPanel: React.FC<MissionsPanelProps> = ({ player, onUpdatePlayer }) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'daily' | 'weekly' | 'special'>('all');

  useEffect(() => {
    // Генерируем миссии
    const mockMissions: Mission[] = [
      {
        id: 'daily_game',
        title: 'Ежедневная игра',
        description: 'Сыграйте одну игру сегодня',
        type: 'daily',
        requirements: [
          { type: 'games_played', value: 1, current: 0 }
        ],
        rewards: {
          experience: 50,
          points: 10
        },
        isCompleted: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'weekly_fields',
        title: 'Исследователь недели',
        description: 'Посетите 3 новых поля за неделю',
        type: 'weekly',
        requirements: [
          { type: 'fields_visited', value: 3, current: 1 }
        ],
        rewards: {
          experience: 200,
          points: 50
        },
        isCompleted: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'social_mission',
        title: 'Социальная активность',
        description: 'Добавьте 5 друзей и оставьте 3 отзыва',
        type: 'special',
        requirements: [
          { type: 'friends_count', value: 5, current: 2 },
          { type: 'reviews_left', value: 3, current: 1 }
        ],
        rewards: {
          experience: 300,
          points: 100,
          items: ['Специальная карта игрока']
        },
        isCompleted: false,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    setMissions(mockMissions);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <ClockIcon className="w-5 h-5" />;
      case 'weekly':
        return <TrophyIcon className="w-5 h-5" />;
      case 'special':
        return <GiftIcon className="w-5 h-5" />;
      default:
        return <StarIcon className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily':
        return 'border-blue-400 bg-blue-100 dark:bg-blue-900/20';
      case 'weekly':
        return 'border-purple-400 bg-purple-100 dark:bg-purple-900/20';
      case 'special':
        return 'border-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'border-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getProgress = (mission: Mission) => {
    return mission.requirements.map(req => {
      let current = 0;
      switch (req.type) {
        case 'games_played':
          current = player.stats.gamesPlayed;
          break;
        case 'fields_visited':
          current = player.stats.fieldsVisited;
          break;
        case 'reviews_left':
          current = player.stats.reviewsLeft;
          break;
        case 'friends_count':
          current = player.friends.length;
          break;
      }
      return { ...req, current: Math.min(current, req.value) };
    });
  };

  const isMissionCompleted = (mission: Mission) => {
    const progress = getProgress(mission);
    return progress.every(req => req.current >= req.value);
  };

  const filteredMissions = missions.filter(mission => 
    selectedType === 'all' || mission.type === selectedType
  );

  const formatTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Истекла';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}д ${hours}ч`;
    return `${hours}ч`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Типы миссий */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => setSelectedType('all')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            selectedType === 'all' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Все
        </button>
        <button
          onClick={() => setSelectedType('daily')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            selectedType === 'daily' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Ежедневные
        </button>
        <button
          onClick={() => setSelectedType('weekly')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            selectedType === 'weekly' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Еженедельные
        </button>
        <button
          onClick={() => setSelectedType('special')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            selectedType === 'special' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Особые
        </button>
      </div>

      {/* Список миссий */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {filteredMissions.map(mission => {
            const progress = getProgress(mission);
            const completed = isMissionCompleted(mission);
            const timeLeft = formatTimeLeft(mission.expiresAt);

            return (
              <div
                key={mission.id}
                className={`border-2 rounded-lg p-4 transition-all ${
                  completed 
                    ? 'border-green-400 bg-green-100 dark:bg-green-900/20' 
                    : getTypeColor(mission.type)
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {getTypeIcon(mission.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {mission.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <ClockIcon className="w-4 h-4" />
                        <span>{timeLeft}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {mission.description}
                    </p>
                    
                    {/* Требования */}
                    <div className="space-y-2 mb-3">
                      {mission.requirements.map((req, index) => {
                        const progress = getProgress(mission)[index];
                        const progressPercent = (progress.current / req.value) * 100;
                        
                        return (
                          <div key={index}>
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                              <span>{req.type === 'games_played' ? 'Игры' : 
                                    req.type === 'fields_visited' ? 'Поля' :
                                    req.type === 'reviews_left' ? 'Отзывы' :
                                    req.type === 'friends_count' ? 'Друзья' : req.type}</span>
                              <span>{progress.current} / {req.value}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Награды */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <StarIcon className="w-4 h-4" />
                        <span>+{mission.rewards.experience} опыта</span>
                      </div>
                      {mission.rewards.points && (
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <TrophyIcon className="w-4 h-4" />
                          <span>+{mission.rewards.points} очков</span>
                        </div>
                      )}
                      {mission.rewards.items && (
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <GiftIcon className="w-4 h-4" />
                          <span>{mission.rewards.items.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {completed && (
                      <div className="mt-3 p-2 bg-green-500/20 rounded-lg">
                        <p className="text-green-700 dark:text-green-300 text-sm text-center">
                          ✓ Миссия выполнена! Нажмите для получения награды
                        </p>
                      </div>
                    )}
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

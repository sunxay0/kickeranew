import React, { useState, useEffect } from 'react';
import { Mission, Player } from '../types';
import { ClockIcon, StarIcon, TrophyIcon, GiftIcon, CheckCircleIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';
import { missionsList } from './missionsData';

interface MissionsPanelProps {
  player: Player;
  onUpdatePlayer: (player: Player) => void;
}

export const MissionsPanel: React.FC<MissionsPanelProps> = ({ player, onUpdatePlayer }) => {
    const [missions, setMissions] = useState<Mission[]>(missionsList);
    const [selectedType, setSelectedType] = useState<'all' | 'daily' | 'weekly' | 'special'>('all');
    const [now, setNow] = useState(Date.now());
    const { t } = useSettings();

    useEffect(() => {
        let updatedPlayer = null;
        let hasChanges = false;

        const checkMissions = () => {
            for (const mission of missionsList) {
                const isAlreadyClaimed = (player.completedMissions || []).includes(mission.id);
                if (isAlreadyClaimed) continue;

                const isNowCompleted = mission.requirements.every(req => {
                    switch (req.type) {
                        case 'games_played': return player.stats.gamesPlayed >= req.value;
                        case 'fields_visited': return player.stats.fieldsVisited >= req.value;
                        case 'reviews_left': return player.stats.reviewsLeft >= req.value;
                        case 'friends_count': return player.friends.length >= req.value;
                        default: return false;
                    }
                });

                if (isNowCompleted) {
                    if (!updatedPlayer) {
                        updatedPlayer = { 
                            ...player, 
                            stats: { ...player.stats }, 
                            completedMissions: [...(player.completedMissions || [])] 
                        };
                    }
                    hasChanges = true;
                    updatedPlayer.experience = (updatedPlayer.experience || 0) + mission.rewards.experience;
                    updatedPlayer.stats.missionPoints = (updatedPlayer.stats.missionPoints || 0) + (mission.rewards.points || 0);
                    updatedPlayer.completedMissions.push(mission.id);
                    
                    if (mission.rewards.items) {
                        updatedPlayer.achievements = [...(updatedPlayer.achievements || []), ...mission.rewards.items];
                    }
                }
            }

            if (hasChanges && updatedPlayer) {
                let currentXp = updatedPlayer.experience;
                let currentLevel = updatedPlayer.level;
                let xpForLevel = 1000 * Math.pow(1.2, currentLevel || 1);
                
                while (currentXp >= xpForLevel) {
                    currentLevel += 1;
                    currentXp -= xpForLevel;
                    xpForLevel = 1000 * Math.pow(1.2, currentLevel);
                }
                updatedPlayer.experience = currentXp;
                updatedPlayer.level = currentLevel;

                onUpdatePlayer(updatedPlayer);
            }
        };

        checkMissions();
    }, [player.stats.gamesPlayed, player.stats.fieldsVisited, player.stats.reviewsLeft, player.friends.length, player.completedMissions, onUpdatePlayer]);
  
    useEffect(() => {
      const interval = setInterval(() => setNow(Date.now()), 60000);
      return () => clearInterval(interval);
    }, []);
  
    const getProgress = (requirement: Mission['requirements'][0]) => {
      switch (requirement.type) {
        case 'games_played': return player.stats.gamesPlayed;
        case 'fields_visited': return player.stats.fieldsVisited;
        case 'reviews_left': return player.stats.reviewsLeft;
        case 'friends_count': return player.friends.length;
        default: return 0;
      }
    };
  
    const isMissionClaimed = (mission: Mission) => {
      return (player.completedMissions || []).includes(mission.id);
    };
  
    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'daily': return <ClockIcon className="w-5 h-5" />;
        case 'weekly': return <TrophyIcon className="w-5 h-5" />;
        case 'special': return <GiftIcon className="w-5 h-5" />;
        default: return <StarIcon className="w-5 h-5" />;
      }
    };
  
    const getTypeColor = (type: string) => {
      switch (type) {
        case 'daily': return 'border-blue-400 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300';
        case 'weekly': return 'border-purple-400 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300';
        case 'special': return 'border-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-300';
        default: return 'border-gray-400 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300';
      }
    };
  
    const filteredMissions = missions.filter(mission => selectedType === 'all' || mission.type === selectedType);
  
    const formatTimeLeft = (expiresAt: string) => {
      const diff = new Date(expiresAt).getTime() - now;
      if (new Date(expiresAt).getFullYear() === 2099) return '∞';
      if (diff <= 0) return 'Истекла';
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return days > 0 ? `${days}д ${hours}ч` : `${hours}ч`;
    };
  
    const getRequirementText = (req: {type: string, value: number}) => {
      switch(req.type) {
          case 'games_played': return `Сыграть игр: ${req.value}`;
          case 'fields_visited': return `Посетить полей: ${req.value}`;
          case 'reviews_left': return `Оставить отзывов: ${req.value}`;
          case 'friends_count': return `Добавить друзей: ${req.value}`;
          default: return req.type;
      }
    };
  
    return (
      <div className="h-full flex flex-col">
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {(['all', 'daily', 'weekly', 'special'] as const).map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex-1 p-3 text-sm font-medium transition-colors ${selectedType === type ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            >
              {t(type)}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {filteredMissions.map(mission => {
              const claimed = isMissionClaimed(mission);
              return (
                <div key={mission.id} className={`border-2 rounded-lg p-4 transition-all ${claimed ? getTypeColor(mission.type).replace('text-', 'border-') : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 opacity-70'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`text-2xl p-2 rounded-full ${getTypeColor(mission.type)}`}>
                      {getTypeIcon(mission.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{mission.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <ClockIcon className="w-4 h-4" />
                          <span>{formatTimeLeft(mission.expiresAt)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{mission.description}</p>
                      <div className="space-y-2 mb-3">
                        {mission.requirements.map((req, index) => {
                          const currentProgress = getProgress(req);
                          const progressPercent = (currentProgress / req.value) * 100;
                          return (
                            <div key={index}>
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                <span>{getRequirementText(req)}</span>
                                <span>{Math.min(currentProgress, req.value)} / {req.value}</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-4 text-xs mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <span className="font-semibold">Награды:</span>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <StarIcon className="w-4 h-4 text-yellow-400" />
                          <span>+{mission.rewards.experience} {t('experience')}</span>
                        </div>
                        {mission.rewards.points && (
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <TrophyIcon className="w-4 h-4 text-purple-400" />
                            <span>+{mission.rewards.points} {t('points')}</span>
                          </div>
                        )}
                        {mission.rewards.items && (
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <GiftIcon className="w-4 h-4 text-pink-400" />
                            <span>{mission.rewards.items.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      <div
                        className={`w-full mt-4 p-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 ${
                          claimed
                            ? 'bg-green-600 text-white cursor-default'
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-default'
                        }`}
                      >
                        {claimed ? <><CheckCircleIcon/> {t('claimed')}</> : t('inProgress')}
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
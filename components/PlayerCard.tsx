import React from 'react';
import { PlayerCard as PlayerCardType } from '../types';
import { StarIcon, TrophyIcon } from './icons';

interface PlayerCardProps {
  playerCard: PlayerCardType;
  playerName: string;
  playerAvatar: string;
  isSpecial?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ 
  playerCard, 
  playerName, 
  playerAvatar, 
  isSpecial = false 
}) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'bronze':
        return 'from-amber-600 to-amber-800';
      case 'silver':
        return 'from-gray-400 to-gray-600';
      case 'gold':
        return 'from-yellow-400 to-yellow-600';
      case 'special':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'bronze':
        return 'Бронзовая';
      case 'silver':
        return 'Серебряная';
      case 'gold':
        return 'Золотая';
      case 'special':
        return 'Особая';
      default:
        return 'Обычная';
    }
  };

  const getCharacteristicColor = (value: number) => {
    if (value >= 90) return 'text-green-500';
    if (value >= 80) return 'text-blue-500';
    if (value >= 70) return 'text-yellow-500';
    if (value >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className={`relative bg-gradient-to-br ${getRarityColor(playerCard.rarity)} rounded-xl p-4 shadow-lg border-2 border-white/20`}>
      {isSpecial && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
          ⭐ ИГРОК НЕДЕЛИ
        </div>
      )}
      
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <img 
            src={playerAvatar} 
            alt={playerName}
            className="w-16 h-16 rounded-full border-2 border-white/30"
          />
          <div>
            <h3 className="text-white font-bold text-lg">{playerName}</h3>
            <p className="text-white/80 text-sm">{getRarityText(playerCard.rarity)} карта</p>
            <div className="flex items-center gap-1 mt-1">
              <StarIcon className="w-4 h-4 text-yellow-300" />
              <span className="text-white font-bold">{playerCard.overallRating}</span>
            </div>
          </div>
        </div>

        {/* Characteristics */}
        <div className="space-y-2">
          <h4 className="text-white font-semibold text-sm mb-2">Характеристики:</h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white/80">Скорость:</span>
              <span className={`font-bold ${getCharacteristicColor(playerCard.characteristics.speed)}`}>
                {playerCard.characteristics.speed}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/80">Удар:</span>
              <span className={`font-bold ${getCharacteristicColor(playerCard.characteristics.shooting)}`}>
                {playerCard.characteristics.shooting}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/80">Передача:</span>
              <span className={`font-bold ${getCharacteristicColor(playerCard.characteristics.passing)}`}>
                {playerCard.characteristics.passing}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/80">Защита:</span>
              <span className={`font-bold ${getCharacteristicColor(playerCard.characteristics.defending)}`}>
                {playerCard.characteristics.defending}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/80">Выносливость:</span>
              <span className={`font-bold ${getCharacteristicColor(playerCard.characteristics.stamina)}`}>
                {playerCard.characteristics.stamina}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/80">Техника:</span>
              <span className={`font-bold ${getCharacteristicColor(playerCard.characteristics.technique)}`}>
                {playerCard.characteristics.technique}
              </span>
            </div>
          </div>
        </div>

        {/* Special Abilities */}
        {playerCard.specialAbilities.length > 0 && (
          <div className="mt-4">
            <h4 className="text-white font-semibold text-sm mb-2">Особые способности:</h4>
            <div className="space-y-1">
              {playerCard.specialAbilities.map((ability, index) => (
                <div key={index} className="text-white/80 text-xs flex items-center gap-1">
                  <TrophyIcon className="w-3 h-3 text-yellow-300" />
                  {ability}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Card Info */}
        {playerCard.isSpecial && playerCard.validUntil && (
          <div className="mt-3 p-2 bg-yellow-400/20 rounded-lg">
            <p className="text-yellow-200 text-xs text-center">
              Действует до: {new Date(playerCard.validUntil).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


import React from 'react';
import { Player } from '../types';
import { LeaderboardPanel } from '../components/LeaderboardPanel';
import { ArrowLeftIcon } from '../components/icons';
import { useSettings } from '../contexts/SettingsContext';

interface LeaderboardScreenProps {
  user: Player;
  onClose: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ user, onClose }) => {
  const { t } = useSettings();
  return (
    <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900 z-40 flex flex-col">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm p-3 flex items-center gap-4 z-20 w-full flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <ArrowLeftIcon />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t('leaderboards')}</h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        <LeaderboardPanel currentPlayer={user} />
      </div>
    </div>
  );
};

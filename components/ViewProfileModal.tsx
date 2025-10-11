import React from 'react';
import { Player } from '../types';
import { XMarkIcon, UserPlusIcon, StarIcon, UsersIcon, FootballIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface ViewProfileModalProps {
  currentUser: Player;
  viewedUser: Player;
  onClose: () => void;
  onSendFriendRequest: (targetUser: Player) => void;
}

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg flex flex-col items-center justify-center text-center">
        <div className="text-green-400">{icon}</div>
        <p className="text-xl font-bold mt-1">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
);

export const ViewProfileModal: React.FC<ViewProfileModalProps> = ({ currentUser, viewedUser, onClose, onSendFriendRequest }) => {
  const { t } = useSettings();

  const getFriendshipButton = () => {
    if (currentUser.friends.includes(viewedUser.id)) {
      return (
        <button className="w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-lg cursor-default">
          {t('alreadyFriends')}
        </button>
      );
    }
    if (currentUser.friendRequestsSent.includes(viewedUser.id)) {
      return (
        <button className="w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-lg cursor-default">
          {t('requestSent')}
        </button>
      );
    }
    return (
      <button
        onClick={() => onSendFriendRequest(viewedUser)}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
      >
        <div className="flex items-center justify-center gap-2">
            <UserPlusIcon className="w-5 h-5" />
            <span>{t('addFriend')}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition">
          <XMarkIcon />
        </button>
        
        <div className="flex flex-col items-center text-center">
            <img src={viewedUser.avatar} alt={viewedUser.name} className="w-24 h-24 rounded-full border-4 border-gray-300 dark:border-gray-600 shadow-lg object-cover" />
            <div className="mt-4">
                <h1 className="text-3xl font-bold">{viewedUser.name}</h1>
                <p className="text-gray-500 dark:text-gray-400">@{viewedUser.handle}</p>
            </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 my-6">
            <StatCard icon={<UsersIcon className="w-6 h-6"/>} label={t('fieldsVisited')} value={viewedUser.stats.fieldsVisited} />
            <StatCard icon={<FootballIcon />} label={t('gamesPlayed')} value={viewedUser.stats.gamesPlayed} />
            <StatCard icon={<StarIcon className="w-6 h-6" />} label={t('reviewsLeft')} value={viewedUser.stats.reviewsLeft} />
        </div>
        
        {getFriendshipButton()}

      </div>
    </div>
  );
};
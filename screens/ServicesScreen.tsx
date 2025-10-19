import React, { useState } from 'react';
import {
    UserGroupIcon,
    SettingsIcon,
    HeartIcon,
    NewspaperIcon,
    LeaderboardIcon,
    ClipsIcon,
    GiftIcon,
    GamesIcon,
    TrophyIcon,
    PlayerCardIcon,
    QuickMatchIcon,
    XMarkIcon
} from '../components/icons';
import { useSettings } from '../contexts/SettingsContext';
import { ProfileTab } from './ProfileScreen';
import { Tab } from '../components/TabBar';

interface ServiceItemProps {
    icon: React.ReactNode;
    label: string;
    color: string;
    onClick: () => void;
}

const ServiceItem: React.FC<ServiceItemProps> = ({ icon, label, color, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-2 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1">
        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white transition-transform transform hover:scale-110 ${color}`}>
            {icon}
        </div>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
    </button>
);

const ComingSoonModal: React.FC<{ title: string; description: string; onClose: () => void }> = ({ title, description, onClose }) => {
    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative">
                    <h3 className="text-xl font-bold mb-4 text-indigo-500">{title}</h3>
                    <button onClick={onClose} className="absolute -top-2 -right-2 p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
                <p className="mb-6 text-gray-600 dark:text-gray-300">{description}</p>
                <button
                    onClick={onClose}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition"
                >
                    Понятно
                </button>
            </div>
        </div>
    );
};


interface ServicesScreenProps {
  onNavigateToProfile: (subTab: ProfileTab) => void;
  onOpenSettings: () => void;
  setActiveTab: (tab: Tab | 'profile') => void;
  onOpenFavorites: () => void;
  onOpenPlayerCard: () => void;
  onOpenLeaderboard: () => void;
  onOpenMissions: () => void;
}

export const ServicesScreen: React.FC<ServicesScreenProps> = ({ onNavigateToProfile, onOpenSettings, setActiveTab, onOpenFavorites, onOpenPlayerCard, onOpenLeaderboard, onOpenMissions }) => {
    const { t } = useSettings();
    const [modalContent, setModalContent] = useState<{ title: string; description: string } | null>(null);

    const handleComingSoon = (title: string, description: string) => {
        setModalContent({ title, description });
    };

    const services = [
        { id: 'friends', icon: <UserGroupIcon className="w-8 h-8" />, label: t('friends'), color: 'bg-blue-500', action: () => onNavigateToProfile('friends') },
        { id: 'articles', icon: <NewspaperIcon className="w-8 h-8" />, label: t('articles'), color: 'bg-orange-400', action: () => setActiveTab('feed') },
        { id: 'leaderboards', icon: <LeaderboardIcon className="w-8 h-8" />, label: t('leaderboards'), color: 'bg-yellow-500', action: onOpenLeaderboard },
        { id: 'clips', icon: <ClipsIcon className="w-8 h-8" />, label: t('clips'), color: 'bg-red-500', 
          action: () => handleComingSoon(
              'Футбольные Клипы',
              'Скоро здесь появится лента с лучшими моментами, финтами и голами от уличных футболистов со всего мира. Записывайте свои видео и готовьтесь делиться мастерством!'
          ) 
        },
        
        { id: 'missions', icon: <GiftIcon className="w-8 h-8" />, label: t('missions'), color: 'bg-teal-500', action: onOpenMissions },
        { id: 'mini-games', icon: <GamesIcon className="w-8 h-8" />, label: t('mini-games'), color: 'bg-green-500', 
          action: () => handleComingSoon(
              'Футбольные Мини-Игры',
              'Проверьте свою реакцию и знание футбола в увлекательных мини-играх! Соревнуйтесь с друзьями, ставьте рекорды и получайте награды, которые можно будет использовать в приложении.'
          ) 
        },
        { id: 'favorites', icon: <HeartIcon filled className="w-8 h-8" />, label: t('favorites'), color: 'bg-pink-500', action: onOpenFavorites },
        { id: 'settings', icon: <SettingsIcon className="w-8 h-8" />, label: t('settings'), color: 'bg-gray-400 dark:bg-gray-600', action: onOpenSettings },

        { id: 'tournaments', icon: <TrophyIcon className="w-8 h-8" />, label: t('tournaments'), color: 'bg-purple-500', action: () => handleComingSoon('Скоро!', 'Эта функция находится в разработке.') },
        { id: 'quick-match', icon: <QuickMatchIcon className="w-8 h-8" />, label: t('quick-match'), color: 'bg-cyan-500', action: () => handleComingSoon('Скоро!', 'Эта функция находится в разработке.') },
        { id: 'player-card', icon: <PlayerCardIcon className="w-8 h-8" />, label: t('player-card'), color: 'bg-indigo-500', action: onOpenPlayerCard },
    ];
    
    return (
        <div className="h-full w-full overflow-y-auto bg-white dark:bg-gray-900 p-4">
            <div className="grid grid-cols-4 gap-x-2 gap-y-6 max-w-md mx-auto">
                {services.map(service => (
                    <ServiceItem key={service.id} icon={service.icon} label={service.label} color={service.color} onClick={service.action} />
                ))}
            </div>
            {modalContent && (
                <ComingSoonModal 
                    title={modalContent.title}
                    description={modalContent.description}
                    onClose={() => setModalContent(null)}
                />
            )}
        </div>
    );
};
import React from 'react';
import { MapIcon, NewspaperIcon, UserIcon, ChatBubblesIcon, ServicesIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

export type Tab = 'map' | 'feed' | 'chats' | 'services';

interface TabBarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const NavButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
}> = ({ isActive, onClick, label, icon }) => (
    <button
        onClick={onClick}
        className={`relative flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
            isActive ? 'text-green-500' : 'text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400'
        }`}
    >
        {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-green-500 rounded-full" />}
        {icon}
        <span className={`text-xs mt-1 font-semibold transition-colors ${isActive ? 'text-gray-800 dark:text-white' : ''}`}>{label}</span>
    </button>
);


export const TabBar: React.FC<TabBarProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useSettings();
  return (
    <footer className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-t-lg z-30 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="flex justify-around max-w-screen-sm mx-auto">
        <NavButton
            isActive={activeTab === 'map'}
            onClick={() => setActiveTab('map')}
            label={t('map')}
            icon={<MapIcon className="w-6 h-6"/>}
        />
        <NavButton
            isActive={activeTab === 'feed'}
            onClick={() => setActiveTab('feed')}
            label={t('feed')}
            icon={<NewspaperIcon className="w-6 h-6"/>}
        />
        <NavButton
            isActive={activeTab === 'chats'}
            onClick={() => setActiveTab('chats')}
            label={t('chats')}
            icon={<ChatBubblesIcon className="w-6 h-6"/>}
        />
        <NavButton
            isActive={activeTab === 'services'}
            onClick={() => setActiveTab('services')}
            label={t('services')}
            icon={<ServicesIcon className="w-6 h-6"/>}
        />
      </div>
    </footer>
  );
};
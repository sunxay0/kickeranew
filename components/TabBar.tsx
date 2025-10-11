

import React from 'react';
import { MapIcon, NewspaperIcon, UserIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

export type Tab = 'map' | 'feed' | 'profile';

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
        className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
            isActive ? 'text-green-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
    >
        {icon}
        <span className={`text-xs mt-1 font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
    </button>
);


export const TabBar: React.FC<TabBarProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useSettings();
  return (
    <footer className="w-full bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-t-lg z-30 border-t border-gray-100 dark:border-gray-700">
      <div className="flex justify-around max-w-screen-sm mx-auto">
        <NavButton
            isActive={activeTab === 'map'}
            onClick={() => setActiveTab('map')}
            label={t('map')}
            icon={<MapIcon />}
        />
        <NavButton
            isActive={activeTab === 'feed'}
            onClick={() => setActiveTab('feed')}
            label={t('feed')}
            icon={<NewspaperIcon />}
        />
        <NavButton
            isActive={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            label={t('profile')}
            icon={<UserIcon />}
        />
      </div>
    </footer>
  );
};
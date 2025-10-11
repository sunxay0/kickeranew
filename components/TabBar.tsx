

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
        className={`flex flex-col items-center justify-center w-full py-3 px-4 transition-all duration-300 rounded-2xl ${
            isActive 
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg transform scale-105' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
        }`}
    >
        <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
            {icon}
        </div>
        <span className={`text-xs mt-1 font-medium transition-colors duration-300 ${
            isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
        }`}>{label}</span>
    </button>
);


export const TabBar: React.FC<TabBarProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useSettings();
  return (
    <footer className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl z-30 border-t border-white/20 dark:border-gray-700/50">
      <div className="flex justify-around max-w-screen-sm mx-auto p-2">
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
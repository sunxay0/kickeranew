import React, { useState, useRef, useEffect } from 'react';
import { FootballIcon, BellIcon, SearchIcon, UserIcon, LogoutIcon } from './icons';
import { Player } from '../types';
import { Tab } from './TabBar';
import { useSettings } from '../contexts/SettingsContext';

interface HeaderProps {
  user: Player;
  activeTab: Tab | 'profile';
  setActiveTab: (tab: Tab | 'profile') => void;
  onGoToProfile: () => void;
  pendingRequestCount: number;
  onToggleNotifications: () => void;
  onSearchClick: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, activeTab, setActiveTab, onGoToProfile, pendingRequestCount, onToggleNotifications, onSearchClick, onLogout }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useSettings();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm p-3 flex justify-between items-center z-20 w-full border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="flex items-center gap-3">
        <FootballIcon />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">KickEra</h1>
      </div>

      {activeTab === 'map' && (
        <div className="flex-1 mx-4 max-w-lg">
          <button 
            onClick={onSearchClick}
            className="w-full flex items-center gap-2 text-left bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors p-2 px-4 rounded-full"
          >
            <SearchIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('addressSearchPlaceholder')}</span>
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 relative" ref={userMenuRef}>
          <div className="relative">
            <button onClick={onToggleNotifications} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <BellIcon />
                {pendingRequestCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                        {pendingRequestCount}
                    </span>
                )}
            </button>
          </div>
          <button onClick={() => setIsUserMenuOpen(prev => !prev)}>
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full border-2 border-transparent hover:border-green-500 transition-colors" />
          </button>
          
          {isUserMenuOpen && (
            <div className="absolute top-12 right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50">
              <button 
                onClick={() => { onGoToProfile(); setIsUserMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <UserIcon className="w-5 h-5" />
                <span>{t('profile')}</span>
              </button>
              <button 
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <LogoutIcon className="w-5 h-5" />
                <span>{t('logOut')}</span>
              </button>
            </div>
          )}
      </div>
    </header>
  );
};
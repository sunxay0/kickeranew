
import React from 'react';
import { FootballIcon, BellIcon } from './icons';

interface HeaderProps {
  title: string;
  pendingRequestCount: number;
  onToggleNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, pendingRequestCount, onToggleNotifications }) => {
  return (
    <header className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-lg border-b border-white/20 dark:border-gray-700/50 p-4 flex justify-between items-center z-20 w-full">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white text-lg font-bold">⚽</span>
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          {title}
        </h1>
      </div>
      <div className="relative">
          <button 
            onClick={onToggleNotifications} 
            className="p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300 hover:scale-105 shadow-lg border border-white/20 dark:border-gray-700/50"
          >
              <BellIcon />
              {pendingRequestCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold shadow-lg animate-pulse">
                      {pendingRequestCount}
                  </span>
              )}
          </button>
      </div>
    </header>
  );
};
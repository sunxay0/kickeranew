
import React from 'react';
import { FootballIcon, BellIcon } from './icons';

interface HeaderProps {
  title: string;
  pendingRequestCount: number;
  onToggleNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, pendingRequestCount, onToggleNotifications }) => {
  return (
    <header className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md p-3 flex justify-between items-center z-20 w-full border-b border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <FootballIcon />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
      </div>
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
    </header>
  );
};
import React from 'react';
import { FieldStatus, SurfaceType } from '../types';
import { useSettings } from '../contexts/SettingsContext';

interface FilterPanelProps {
  filters: {
    status: string;
    surface: string;
    rating: number;
    radius: number;
    showFavorites: boolean;
    minPlayers: number;
  };
  onFilterChange: (filters: FilterPanelProps['filters']) => void;
}

const FilterSelect: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode }> = ({ label, value, onChange, children }) => (
    <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {children}
        </select>
    </div>
);

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilterChange }) => {
  const { t } = useSettings();
  const handleFilterChange = (key: keyof typeof filters, value: string | number | boolean) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-gray-50/90 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg shadow-lg w-64 text-gray-900 dark:text-white">
      <h3 className="font-bold text-lg mb-3">{t('filters')}</h3>
      <div className="space-y-4">
        <FilterSelect
          label={t('fieldStatus')}
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="all">All Statuses</option>
          {Object.values(FieldStatus).map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </FilterSelect>

        <FilterSelect
          label={t('surfaceType')}
          value={filters.surface}
          onChange={(e) => handleFilterChange('surface', e.target.value)}
        >
          <option value="all">All Surfaces</option>
          {Object.values(SurfaceType).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </FilterSelect>
        
        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg">
            <label htmlFor="favorites-toggle" className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('favoritesOnly')}</label>
            <label htmlFor="favorites-toggle" className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="favorites-toggle" className="sr-only peer" checked={filters.showFavorites} onChange={() => handleFilterChange('showFavorites', !filters.showFavorites)} />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        </div>

        <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('minRating')}: {filters.rating.toFixed(1)} ★</label>
            <input 
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
        </div>
        
        <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('minPlayers')}: {filters.minPlayers}+</label>
            <input 
                type="range"
                min="0"
                max="22"
                step="1"
                value={filters.minPlayers}
                onChange={(e) => handleFilterChange('minPlayers', parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
        </div>

        <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('searchRadius')}: {(filters.radius / 1000).toFixed(1)} km</label>
            <input 
                type="range"
                min="1000"
                max="20000"
                step="500"
                value={filters.radius}
                onChange={(e) => handleFilterChange('radius', parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
        </div>
      </div>
    </div>
  );
};
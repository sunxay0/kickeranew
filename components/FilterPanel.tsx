import React, { useState } from 'react';
import { SurfaceType } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { ArrowLeftIcon } from './icons';

interface FilterPanelProps {
  filters: {
    radius: number;
    showFavorites: boolean;
    minPlayers: number;
    minRating: number;
    hasTournaments: boolean;
    isOpen: boolean;
    surface: string;
    lighting: boolean;
    size: string;
  };
  onFilterChange: (filters: FilterPanelProps['filters']) => void;
}

const FilterSlider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; displayValue: string; }> = ({ label, value, min, max, step, onChange, displayValue }) => (
    <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}: {displayValue}</label>
        <input 
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
    </div>
);

const FilterToggle: React.FC<{ label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</label>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
    </div>
);

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
  const [view, setView] = useState<'basic' | 'advanced'>('basic');

  const handleFilterChange = (key: keyof typeof filters, value: string | number | boolean) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="relative bg-gray-50/95 dark:bg-gray-800/90 backdrop-blur-sm p-4 rounded-lg shadow-lg w-72 text-gray-900 dark:text-white overflow-hidden">
      
      {/* Basic Filters Panel */}
      <div className={`transition-transform duration-300 ease-in-out ${view === 'advanced' ? '-translate-x-[120%]' : 'translate-x-0'}`}>
        <h3 className="font-bold text-lg mb-4">{t('filters')}</h3>
        <div className="space-y-4">
          <FilterSlider
            label={t('searchRadius')}
            value={filters.radius}
            min={1000}
            max={20000}
            step={500}
            onChange={(e) => handleFilterChange('radius', parseInt(e.target.value, 10))}
            displayValue={`${(filters.radius / 1000).toFixed(1)} km`}
          />
          <FilterToggle
            label={t('favoritesOnly')}
            checked={filters.showFavorites}
            onChange={(e) => handleFilterChange('showFavorites', e.target.checked)}
          />
          <FilterSlider
            label={t('minPlayers')}
            value={filters.minPlayers}
            min={0}
            max={22}
            step={1}
            onChange={(e) => handleFilterChange('minPlayers', parseInt(e.target.value, 10))}
            displayValue={`${filters.minPlayers}+`}
          />
          <button 
            onClick={() => setView('advanced')}
            className="w-full text-sm text-indigo-600 dark:text-indigo-400 hover:underline text-center pt-2"
          >
            {t('advancedFilters')} &rarr;
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className={`absolute top-0 left-0 w-full h-full p-4 bg-gray-50/95 dark:bg-gray-800/90 transition-transform duration-300 ease-in-out flex flex-col ${view === 'advanced' ? 'translate-x-0' : 'translate-x-[120%]'}`}>
        <div className="flex items-center mb-4 flex-shrink-0">
          <button onClick={() => setView('basic')} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-2">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h3 className="font-bold text-lg">{t('advancedFilters')}</h3>
        </div>
        <div className="space-y-4 overflow-y-auto">
            <FilterSlider
              label={t('searchRadius')}
              value={filters.radius}
              min={1000}
              max={50000}
              step={500}
              onChange={(e) => handleFilterChange('radius', parseInt(e.target.value, 10))}
              displayValue={`${(filters.radius / 1000).toFixed(1)} km`}
            />
            <FilterSlider
              label={t('minRating')}
              value={filters.minRating}
              min={0}
              max={5}
              step={0.5}
              onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
              displayValue={`${filters.minRating.toFixed(1)} ★`}
            />
            <FilterToggle
                label={t('hasTournaments')}
                checked={filters.hasTournaments}
                onChange={(e) => handleFilterChange('hasTournaments', e.target.checked)}
            />
             <FilterToggle
                label={t('isOpenNow')}
                checked={filters.isOpen}
                onChange={(e) => handleFilterChange('isOpen', e.target.checked)}
            />
            <FilterToggle
                label={t('lighting')}
                checked={filters.lighting}
                onChange={(e) => handleFilterChange('lighting', e.target.checked)}
            />
            <FilterSelect
              label={t('surfaceType')}
              value={filters.surface}
              onChange={(e) => handleFilterChange('surface', e.target.value)}
            >
              <option value="all">All Surfaces</option>
              {Object.values(SurfaceType).map(type => (
                // FIX: Added 'as string' to resolve typing issue after fixing enum definitions.
                <option key={type} value={type}>{t((type as string).toLowerCase() as any)}</option>
              ))}
            </FilterSelect>
            <FilterSelect
              label={t('fieldSize')}
              value={filters.size}
              onChange={(e) => handleFilterChange('size', e.target.value)}
            >
              <option value="all">All Sizes</option>
              <option value="small">{t('small')}</option>
              <option value="medium">{t('medium')}</option>
              <option value="large">{t('large')}</option>
            </FilterSelect>
        </div>
      </div>
    </div>
  );
};

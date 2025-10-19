import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, XMarkIcon, LoadingSpinner } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface AddressSearchProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  onClose: () => void;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

export const AddressSearch: React.FC<AddressSearchProps> = ({ onLocationSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useSettings();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const searchAddresses = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=ru`
        );
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Error searching addresses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchAddresses, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    onLocationSelect(
      parseFloat(result.lat),
      parseFloat(result.lon),
      result.display_name
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-30" onClick={onClose}>
      <div 
        className="w-full max-w-lg mx-auto mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700" 
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <SearchIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchAddressOrCity')}
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-6">
              <LoadingSpinner />
            </div>
          ) : results.length > 0 ? (
            <div>
              {results.map((result, index) => (
                <button
                  key={result.place_id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white ${index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}
                >
                  <div className="truncate font-medium">{result.display_name.split(',')[0]}</div>
                  <div className="truncate text-xs text-gray-500 dark:text-gray-400">{result.display_name.substring(result.display_name.indexOf(',') + 1).trim()}</div>
                </button>
              ))}
            </div>
          ) : query.length >= 3 && (
            <div className="text-center p-6 text-gray-500 text-sm">
              {t('nothingFound')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
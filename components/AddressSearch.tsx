import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, XMarkIcon } from './icons';
import L from 'leaflet';

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
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setShowResults(false);
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
        setShowResults(true);
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
    setShowResults(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="absolute top-4 right-4 z-20 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <SearchIcon className="w-5 h-5 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Поиск адреса или города..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500"
          />
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-2 text-gray-500">
            Поиск...
          </div>
        )}

        {showResults && results.length > 0 && (
          <div className="max-h-60 overflow-y-auto">
            {results.map((result) => (
              <button
                key={result.place_id}
                onClick={() => handleResultClick(result)}
                className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm text-gray-900 dark:text-white"
              >
                <div className="truncate">{result.display_name}</div>
              </button>
            ))}
          </div>
        )}

        {showResults && results.length === 0 && !isLoading && query.length >= 3 && (
          <div className="text-center py-2 text-gray-500 text-sm">
            Ничего не найдено
          </div>
        )}
      </div>
    </div>
  );
};


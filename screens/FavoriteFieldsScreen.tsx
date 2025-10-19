
import React, { useMemo } from 'react';
import { Player, Field } from '../types';
// FIX: Import the missing HeartIcon component.
import { ArrowLeftIcon, StarIcon, UserGroupIcon, HeartIcon } from '../components/icons';
import { useSettings } from '../contexts/SettingsContext';

interface FavoriteFieldsScreenProps {
  user: Player;
  fields: Field[];
  onClose: () => void;
  setSelectedField: (field: Field) => void;
  onNavigateToMap: () => void;
}

export const FavoriteFieldsScreen: React.FC<FavoriteFieldsScreenProps> = ({ user, fields, onClose, setSelectedField, onNavigateToMap }) => {
  const { t } = useSettings();
  const favoriteFieldsData = useMemo(() => {
    return (user.favoriteFields || []).map(favId => fields.find(f => f.id === favId)).filter((f): f is Field => !!f);
  }, [user.favoriteFields, fields]);

  const handleFieldClick = (field: Field) => {
    setSelectedField(field);
    onNavigateToMap();
  };

  return (
    <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900 z-40 flex flex-col">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm p-3 flex items-center gap-4 z-20 w-full flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <ArrowLeftIcon />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t('favorites')}</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {favoriteFieldsData.length > 0 ? (
          favoriteFieldsData.map(field => (
            <button key={field.id} onClick={() => handleFieldClick(field)} className="w-full flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left shadow">
              <img src={field.photo} alt={field.name} className="w-24 h-16 object-cover rounded-md" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">{field.name}</h4>
                <div className="flex items-center text-sm text-yellow-400 mt-1">
                  <StarIcon className="w-4 h-4"/>
                  <span className="ml-1 font-bold">{field.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <UserGroupIcon className="w-4 h-4" />
                <span>{field.players.length}</span>
              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <HeartIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
              {t('noFavoriteFields')}
            </h3>
          </div>
        )}
      </div>
    </div>
  );
};

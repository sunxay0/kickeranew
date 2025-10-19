import React, { useState } from 'react';
import L from 'leaflet';
// Fix: Imported `FieldStatus` to set a default status for new fields.
import { Field, SurfaceType, FieldStatus } from '../types';
import { XMarkIcon, CameraIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface AddNewFieldProps {
  center: L.LatLng;
  onClose: () => void;
  onAdd: (fieldData: Omit<Field, 'id' | 'rating' | 'players' | 'reviews' | 'chat'>, photoFile: File | null) => void;
}

export const AddNewField: React.FC<AddNewFieldProps> = ({ center, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [surface, setSurface] = useState<SurfaceType>(SurfaceType.Rubber);
  const [lighting, setLighting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const { t } = useSettings();
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') {
        alert("Please enter a name for the field.");
        return;
    }
    // Fix: Added the missing `status` property, defaulting to 'Available' for new fields.
    onAdd({
        name,
        lat: center.lat,
        lng: center.lng,
        status: FieldStatus.Available,
        surface,
        lighting,
        photo: '', // Photo URL will be determined by parent after upload
        size,
    }, photoFile);
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4">
      <div className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition">
          <XMarkIcon />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">{t('addNewFieldTitle')}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
             <label htmlFor="photo-upload" className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer mb-4 relative overflow-hidden">
                {photoPreview ? (
                    <img src={photoPreview} alt="Field preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <CameraIcon className="w-10 h-10 mx-auto" />
                        <p className="text-sm mt-1">Add Photo</p>
                    </div>
                )}
             </label>
             <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange}/>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t('fieldName')}</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={t('fieldNamePlaceholder')}
              required
            />
          </div>
          <div>
            <label htmlFor="surface" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t('surfaceType')}</label>
            <select
              id="surface"
              value={surface}
              onChange={(e) => setSurface(e.target.value as SurfaceType)}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.values(SurfaceType).map(type => (
                // FIX: Added 'as string' to resolve typing issue after fixing enum definitions.
                <option key={type} value={type}>{t((type as string).toLowerCase() as any)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="size" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t('fieldSize')}</label>
            <select
              id="size"
              value={size}
              onChange={(e) => setSize(e.target.value as 'small' | 'medium' | 'large')}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="small">{t('small')}</option>
              <option value="medium">{t('medium')}</option>
              <option value="large">{t('large')}</option>
            </select>
          </div>
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg">
            <label htmlFor="lighting" className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('hasLighting')}</label>
            <label htmlFor="lighting-toggle" className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="lighting-toggle" className="sr-only peer" checked={lighting} onChange={() => setLighting(!lighting)} />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
           <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
             {t('coordsInfo')} <br/> {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
           </p>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
          >
            {t('addFieldBtn')}
          </button>
        </form>
      </div>
    </div>
  );
};

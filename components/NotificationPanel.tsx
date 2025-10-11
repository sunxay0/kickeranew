import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { XMarkIcon, CheckIcon, XIcon, LoadingSpinner } from './icons';
import { db } from '../firebase';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';

interface NotificationPanelProps {
  currentUser: Player;
  onClose: () => void;
  onAccept: (requesterId: string) => void;
  onDecline: (requesterId: string) => void;
}

const chunk = <T,>(arr: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
);

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ currentUser, onClose, onAccept, onDecline }) => {
  const { t } = useSettings();
  const [requesters, setRequesters] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequesters = async () => {
      setIsLoading(true);
      if (currentUser.friendRequestsReceived.length === 0) {
        setRequesters([]);
        setIsLoading(false);
        return;
      }
      
      const idChunks = chunk(currentUser.friendRequestsReceived, 30);
      const fetchedRequesters: Player[] = [];
      
      for (const idChunk of idChunks) {
          if (idChunk.length > 0) {
              const q = query(collection(db, "users"), where(documentId(), "in", idChunk));
              const querySnapshot = await getDocs(q);
              querySnapshot.forEach((doc) => {
                  fetchedRequesters.push(doc.data() as Player);
              });
          }
      }
      
      setRequesters(fetchedRequesters);
      setIsLoading(false);
    };

    fetchRequesters();
  }, [currentUser.friendRequestsReceived]);

  return (
    <div className="absolute top-16 right-4 z-30">
      <div className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold">{t('notifications')}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <XMarkIcon />
          </button>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">{t('friendRequests')}</h3>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <LoadingSpinner />
            </div>
          ) : requesters.length > 0 ? (
            <ul className="space-y-3">
              {requesters.map((requester) => (
                <li key={requester.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <img src={requester.avatar} alt={requester.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-semibold text-sm">{requester.name}</p>
                      <p className="text-xs text-gray-500">@{requester.handle}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onAccept(requester.id)} className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition">
                      <CheckIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => onDecline(requester.id)} className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-800 transition">
                      <XIcon className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('noNewNotifications')}</p>
          )}
        </div>
      </div>
    </div>
  );
};
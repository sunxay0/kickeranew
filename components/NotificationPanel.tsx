import React, { useMemo } from 'react';
import { Player, Notification } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { XMarkIcon, CheckIcon, XIcon, ChatBubbleIcon } from './icons';

interface NotificationPanelProps {
  currentUser: Player;
  friendRequesters: Player[];
  commentNotifications: Notification[];
  onClose: () => void;
  onAccept: (requesterId: string) => void;
  onDecline: (requesterId: string) => void;
  onMarkCommentAsRead: (notificationId: string) => void;
  onViewProfile: (playerOrId: Player | string) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ 
  currentUser, 
  friendRequesters,
  commentNotifications,
  onClose, 
  onAccept, 
  onDecline,
  onMarkCommentAsRead,
  onViewProfile
}) => {
  const { t } = useSettings();
  
  const hasNotifications = friendRequesters.length > 0 || commentNotifications.length > 0;

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
          {!hasNotifications ? (
             <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('noNewNotifications')}</p>
          ) : (
            <div className="space-y-4">
              {commentNotifications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">{t('newComment')}</h3>
                  <ul className="space-y-3">
                    {commentNotifications.map(notification => (
                       <li key={notification.id} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <button onClick={() => onViewProfile(notification.senderId)} className="w-full flex items-start gap-3 text-left">
                            <img src={notification.senderAvatar} alt={notification.senderName} className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                <span className="font-bold">{notification.senderName}</span> {t('commentFrom')}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                                "{notification.commentText}"
                              </p>
                            </div>
                          </button>
                          <button onClick={() => onMarkCommentAsRead(notification.id)} className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label={t('markAsRead')}>
                            <XIcon className="w-4 h-4" />
                          </button>
                       </li>
                    ))}
                  </ul>
                </div>
              )}
              {friendRequesters.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">{t('friendRequests')}</h3>
                   <ul className="space-y-3">
                    {friendRequesters.map((requester) => (
                      <li key={requester.id} className="flex items-center justify-between gap-2">
                        <button onClick={() => onViewProfile(requester)} className="flex items-center gap-3 text-left">
                          <img src={requester.avatar} alt={requester.name} className="w-10 h-10 rounded-full" />
                          <div>
                            <p className="font-semibold text-sm">{requester.name}</p>
                            <p className="text-xs text-gray-500">@{requester.handle}</p>
                          </div>
                        </button>
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
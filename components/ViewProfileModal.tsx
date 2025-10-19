import React, { useState } from 'react';
import { Player, ProfileComment } from '../types';
import { XMarkIcon, UserPlusIcon, StarIcon, PaperAirplaneIcon, XIcon, FieldsVisitedIcon, GamesPlayedIcon, ReviewsLeftIcon, MessageIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';
import { db } from '../firebase';

interface ViewProfileModalProps {
  currentUser: Player;
  viewedUser: Player;
  onClose: () => void;
  onSendFriendRequest: (targetUser: Player) => void;
  onRemoveFriend: (targetUser: Player) => void;
  onUpdateOtherUser: (targetUser: Player, commentText: string) => void;
  onViewProfile: (playerOrId: Player | string) => void;
  onOpenDirectChat: (user: Player) => void;
}

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg flex flex-col items-center justify-center text-center">
        <div className="text-green-400">{icon}</div>
        <p className="text-xl font-bold mt-1">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
);

export const ViewProfileModal: React.FC<ViewProfileModalProps> = ({ currentUser, viewedUser, onClose, onSendFriendRequest, onRemoveFriend, onUpdateOtherUser, onViewProfile, onOpenDirectChat }) => {
  const { t } = useSettings();
  const [commentText, setCommentText] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handlePostComment = () => {
    if (commentText.trim() === '') return;
    onUpdateOtherUser(viewedUser, commentText);
    setCommentText('');
  };
  
  const handleConfirmRemove = () => {
    onRemoveFriend(viewedUser);
    setShowRemoveConfirm(false);
  };

  const getFriendshipButton = () => {
    if (currentUser.friends.includes(viewedUser.id)) {
      return (
        <button onClick={() => setShowRemoveConfirm(true)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105">
           <div className="flex items-center justify-center gap-2">
                <XIcon className="w-5 h-5"/>
                <span>{t('removeFriend')}</span>
            </div>
        </button>
      );
    }
    if (currentUser.friendRequestsSent.includes(viewedUser.id)) {
      return (
        <button className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-lg cursor-default">
          {t('requestSent')}
        </button>
      );
    }
    return (
      <button
        onClick={() => onSendFriendRequest(viewedUser)}
        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
      >
        <div className="flex items-center justify-center gap-2">
            <UserPlusIcon className="w-5 h-5" />
            <span>{t('addFriend')}</span>
        </div>
      </button>
    );
  };

  return (
    <>
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl shadow-2xl w-full max-w-md relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition z-10">
          <XMarkIcon />
        </button>
        
        <div className="p-6 flex-shrink-0">
            <div className="flex flex-col items-center text-center">
                <img src={viewedUser.avatar} alt={viewedUser.name} className="w-24 h-24 rounded-full border-4 border-gray-300 dark:border-gray-600 shadow-lg object-cover" />
                <div className="mt-4">
                    <h1 className="text-3xl font-bold">{viewedUser.name}</h1>
                    <p className="text-gray-500 dark:text-gray-400">@{viewedUser.handle}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 my-6">
                <StatCard icon={<FieldsVisitedIcon className="w-8 h-8"/>} label={t('fieldsVisited')} value={viewedUser.stats.fieldsVisited} />
                <StatCard icon={<GamesPlayedIcon className="w-8 h-8"/>} label={t('gamesPlayed')} value={viewedUser.stats.gamesPlayed} />
                <StatCard icon={<ReviewsLeftIcon className="w-8 h-8"/>} label={t('reviewsLeft')} value={viewedUser.stats.reviewsLeft} />
            </div>

            <div className="flex gap-2">
                {getFriendshipButton()}
                <button
                    onClick={() => onOpenDirectChat(viewedUser)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
                >
                    <div className="flex items-center justify-center gap-2">
                        <MessageIcon className="w-5 h-5" />
                        <span>{t('message')}</span>
                    </div>
                </button>
            </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6 pt-0 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4">{t('comments')}</h3>
            <div className="space-y-4">
                 {viewedUser.comments.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">{t('noCommentsYet')}</p>
                ) : (
                    [...viewedUser.comments].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(comment => (
                        <div key={comment.id} className="flex items-start gap-3">
                            <button onClick={() => onViewProfile(comment.authorId)} disabled={comment.authorId === viewedUser.id} className="disabled:cursor-default flex-shrink-0">
                                <img src={comment.authorAvatar} alt={comment.authorName} className="w-8 h-8 rounded-full" />
                            </button>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg min-w-0">
                                <div className="flex items-baseline justify-between">
                                  <button onClick={() => onViewProfile(comment.authorId)} disabled={comment.authorId === viewedUser.id} className="font-semibold text-sm disabled:cursor-default text-left">{comment.authorName}</button>
                                  <p className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</p>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 mt-1 text-sm whitespace-pre-wrap break-words">{comment.comment}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-start gap-2">
                <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                    <textarea 
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder={t('leaveCommentPlaceholder')}
                        rows={2}
                        className="w-full bg-white dark:bg-gray-700 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 dark:border-gray-600 text-sm"
                    />
                     <button onClick={handlePostComment} disabled={!commentText.trim()} className="bg-indigo-600 p-2 mt-2 w-full rounded-md hover:bg-indigo-700 font-semibold text-white disabled:bg-gray-400 dark:disabled:bg-gray-600 flex items-center justify-center gap-2">
                        <PaperAirplaneIcon className="w-5 h-5" />
                     </button>
                </div>
            </div>
        </div>
      </div>
    </div>
    
    {showRemoveConfirm && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-bold mb-4">{t('removeFriend')}</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              {t('removeFriendConfirmation')}&nbsp;<strong>{viewedUser.name}</strong>?
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowRemoveConfirm(false)} 
                className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-lg transition"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={handleConfirmRemove}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                {t('removeFriend')}
              </button>
            </div>
          </div>
        </div>
    )}

    </>
  );
};
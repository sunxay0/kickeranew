import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Player, ProfileComment, Field } from '../types';
import { SettingsIcon, CameraIcon, UserGroupIcon, UserPlusIcon, LoadingSpinner, XIcon, PaperAirplaneIcon, FieldsVisitedIcon, GamesPlayedIcon, ReviewsLeftIcon, ChatBubbleIcon, GiftIcon } from '../components/icons';
import { useSettings } from '../contexts/SettingsContext';
import { db, storage } from '../firebase';
// FIX: Use Firebase v8 compat imports
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';


interface ProfileScreenProps {
  user: Player;
  onLogout: () => void;
  onUpdateUser: (user: Player) => void;
  onSendFriendRequest: (targetUser: Player) => void;
  onRemoveFriend: (friend: Player) => void;
  onViewProfile: (playerOrId: Player | string) => void;
  onOpenSettings: () => void;
  initialTab?: ProfileTab;
}

export type ProfileTab = 'stats' | 'friends' | 'comments';

const hydratePlayer = (doc: firebase.firestore.QueryDocumentSnapshot): Player => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    handle: data.handle,
    email: data.email,
    avatar: data.avatar,
    joinDate: data.joinDate,
    stats: { gamesPlayed: 0, fieldsVisited: 0, reviewsLeft: 0, missionPoints: 0, ...(data.stats || {}) },
    authProvider: data.authProvider,
    favoriteFields: data.favoriteFields || [],
    friends: data.friends || [],
    friendRequestsSent: data.friendRequestsSent || [],
    friendRequestsReceived: data.friendRequestsReceived || [],
    currentFieldId: data.currentFieldId !== undefined ? data.currentFieldId : null,
    checkInTime: data.checkInTime || null,
    comments: data.comments || [],
    rating: data.rating || 50,
    level: data.level || 1,
    experience: data.experience || 0,
    achievements: data.achievements || [],
    playerCard: data.playerCard || {
      id: `card-${doc.id}`,
      playerId: doc.id,
      rarity: 'bronze',
      overallRating: data.rating || 50,
      characteristics: {
        speed: 50,
        shooting: 50,
        passing: 50,
        defending: 50,
        stamina: 50,
        technique: 50
      },
      specialAbilities: [],
      isSpecial: false
    },
    completedMissions: data.completedMissions || [],
  };
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center">
        <div className="text-green-400">{icon}</div>
        <p className="text-2xl font-bold mt-2">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
);

const chunk = <T,>(arr: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
);

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout, onUpdateUser, onSendFriendRequest, onRemoveFriend, onViewProfile, onOpenSettings, initialTab }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedHandle, setEditedHandle] = useState(user.handle);
  const [editError, setEditError] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab || 'stats');
  
  const [friendsData, setFriendsData] = useState<Player[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [confirmingRemoveFriend, setConfirmingRemoveFriend] = useState<Player | null>(null);
  
  const [commentText, setCommentText] = useState('');
  const [confirmingDeleteComment, setConfirmingDeleteComment] = useState<ProfileComment | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useSettings();
  
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSave = async () => {
    const newHandle = editedHandle.trim().toLowerCase();
    setEditError('');

    if (newHandle !== user.handle) {
      if (!/^[a-z0-9_]{3,15}$/.test(newHandle)) {
        setEditError(t('invalidHandleError'));
        return;
      }
      const handleQuery = db.collection('users').where('handle', '==', newHandle);
      const snapshot = await handleQuery.get();
      if (!snapshot.empty) {
        setEditError(t('handleInUseError'));
        return;
      }
    }
    
    const updatedUser = {
      ...user,
      name: editedName.trim() || user.name,
      handle: newHandle,
    };
    onUpdateUser(updatedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(user.name);
    setEditedHandle(user.handle);
    setEditError('');
    setIsEditing(false);
  }
  
  const handleAvatarClick = () => {
    if (isEditing && !isUploadingAvatar) {
        fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploadingAvatar || !e.target.files || !e.target.files[0]) {
      return;
    }
  
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert("File is too large. Please select an image under 5MB.");
      if (e.target) e.target.value = ''; // Reset file input
      return;
    }
  
    setIsUploadingAvatar(true);
    try {
      const storageRef = storage.ref(`avatars/${user.id}`);
      const uploadTask = await storageRef.put(file);
      const downloadURL = await uploadTask.ref.getDownloadURL();
  
      onUpdateUser({ ...user, avatar: downloadURL });
  
    } catch (error) {
      console.error("Avatar upload failed:", error);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = ''; // Reset file input
    }
  };

  const fetchFriends = useCallback(async () => {
    if (!user.friends || user.friends.length === 0) {
      setFriendsData([]);
      return;
    }
    setIsLoadingFriends(true);
    const idChunks = chunk(user.friends, 30);
    const fetchedFriends: Player[] = [];

    for (const idChunk of idChunks) {
        if (idChunk.length > 0) {
            const friendsQuery = db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', idChunk);
            const snapshot = await friendsQuery.get();
            snapshot.docs.forEach(doc => {
                fetchedFriends.push(hydratePlayer(doc));
            });
        }
    }
    setFriendsData(fetchedFriends);
    setIsLoadingFriends(false);
  }, [user.friends]);


  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriends();
    }
  }, [activeTab, fetchFriends]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    const queryStr = searchQuery.trim().toLowerCase();
    const handleDbQuery = db.collection('users').where('handle', '==', queryStr);
    
    const handleSnapshot = await handleDbQuery.get();

    const results: Player[] = [];
    handleSnapshot.forEach(doc => {
        if(doc.id !== user.id) results.push(hydratePlayer(doc));
    });

    setSearchResults(results);
    setIsSearching(false);
  };

  const handlePostComment = () => {
    if (commentText.trim() === '') return;
    const newComment: ProfileComment = {
      id: `comment-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      comment: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    const updatedUser = {
      ...user,
      comments: [newComment, ...user.comments],
    };
    onUpdateUser(updatedUser);
    setCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    if (!confirmingDeleteComment || confirmingDeleteComment.id !== commentId) return;
    const updatedUser = {
      ...user,
      comments: user.comments.filter(c => c.id !== commentId),
    };
    onUpdateUser(updatedUser);
    setConfirmingDeleteComment(null);
  };
  
  const getFriendshipStatusButton = (targetUser: Player) => {
    if (user.friends.includes(targetUser.id)) {
      return <span className="text-xs text-gray-400 dark:text-gray-500">{t('alreadyFriends')}</span>
    }
    if (user.friendRequestsSent.includes(targetUser.id)) {
      return <span className="text-xs text-gray-400 dark:text-gray-500">{t('requestSent')}</span>
    }
    if (user.friendRequestsReceived.includes(targetUser.id)) {
        return <span className="text-xs text-indigo-400">{t('checkNotifications')}</span>
    }
    return (
      <button onClick={() => onSendFriendRequest(targetUser)} className="p-2 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"><UserPlusIcon className="w-5 h-5"/></button>
    )
  };

  const handleConfirmRemove = () => {
    if (confirmingRemoveFriend) {
        onRemoveFriend(confirmingRemoveFriend);
        setConfirmingRemoveFriend(null);
    }
  };

  return (
    <>
      <div className="h-full w-full flex flex-col p-4 overflow-y-auto">
          {/* User Info Header */}
          <div className="relative p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex-shrink-0">
              <div className="flex flex-col items-center text-center">
                  <div className={`relative group ${isEditing ? 'cursor-pointer' : ''}`} onClick={handleAvatarClick}>
                      <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full border-4 border-green-500 shadow-lg object-cover transition-opacity group-hover:opacity-75" />
                      {isEditing && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              {isUploadingAvatar ? <LoadingSpinner className="w-8 h-8 text-white" /> : <CameraIcon className="h-8 w-8 text-white" />}
                          </div>
                      )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />

                  {isEditing ? (
                      <div className="w-full max-w-xs mt-4 space-y-3">
                          <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              placeholder={t('name')}
                              className="w-full text-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                           <div className="relative">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                               <input
                                  type="text"
                                  value={editedHandle}
                                  onChange={(e) => setEditedHandle(e.target.value)}
                                  placeholder={t('handle')}
                                  className="w-full text-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 pl-7 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                           </div>
                           {editError && <p className="text-red-500 text-xs">{editError}</p>}
                           <div className="flex gap-2">
                               <button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-sm">{t('save')}</button>
                               <button onClick={handleCancel} className="flex-1 bg-gray-100 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg text-sm">{t('cancel')}</button>
                           </div>
                      </div>
                  ) : (
                      <div className="mt-4">
                          <h1 className="text-3xl font-bold">{user.name}</h1>
                          <p className="text-gray-500 dark:text-gray-400">@{user.handle}</p>
                      </div>
                  )}
              </div>

              <div className="absolute top-4 right-4 flex gap-2">
                  {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition" aria-label={t('editProfile')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                          <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                    </button>
                  )}
                   <button onClick={onOpenSettings} className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition" aria-label={t('settings')}>
                        <SettingsIcon className="h-5 w-5" />
                    </button>
              </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mt-6 flex-shrink-0">
              {(['stats', 'friends', 'comments'] as ProfileTab[]).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 p-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === tab ? 'border-b-2 border-green-500 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {t(tab)}
                  </button>
              ))}
          </div>

          {/* Tab Content */}
          <div className="flex-grow mt-6">
              {activeTab === 'stats' && (
                  <div className="grid grid-cols-2 gap-4">
                      <StatCard icon={<GamesPlayedIcon className="w-8 h-8"/>} label={t('gamesPlayed')} value={user.stats.gamesPlayed} />
                      <StatCard icon={<GiftIcon className="w-8 h-8"/>} label={t('missionPoints')} value={user.stats.missionPoints || 0} />
                      <StatCard icon={<FieldsVisitedIcon className="w-8 h-8"/>} label={t('fieldsVisited')} value={user.stats.fieldsVisited} />
                      <StatCard icon={<ReviewsLeftIcon className="w-8 h-8"/>} label={t('reviewsLeft')} value={user.stats.reviewsLeft} />
                  </div>
              )}
              {activeTab === 'friends' && (
                  <div className="space-y-6">
                      <div>
                          <h3 className="text-lg font-bold mb-3">{t('addFriend')}</h3>
                          <form onSubmit={handleSearch} className="flex gap-2">
                              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('searchByHandle')} className="flex-grow bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg" disabled={isSearching}>{isSearching ? <LoadingSpinner /> : "Search"}</button>
                          </form>
                          <div className="mt-4 space-y-2">
                              {searchResults.map(result => (
                                  <div key={result.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                                      <div className="flex items-center gap-3">
                                          <img src={result.avatar} alt={result.name} className="w-10 h-10 rounded-full" />
                                          <div>
                                              <p className="font-semibold">{result.name}</p>
                                              <p className="text-sm text-gray-500">@{result.handle}</p>
                                          </div>
                                      </div>
                                      {getFriendshipStatusButton(result)}
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div>
                          <h3 className="text-lg font-bold mb-3">{t('friends')} ({friendsData.length})</h3>
                          {isLoadingFriends ? <LoadingSpinner /> : (
                              <div className="space-y-2">
                                  {friendsData.map(friend => (
                                      <div key={friend.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                                          <button onClick={() => onViewProfile(friend)} className="flex items-center gap-3 text-left">
                                              <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full" />
                                              <div>
                                                  <p className="font-semibold">{friend.name}</p>
                                                  <p className="text-sm text-gray-500">@{friend.handle}</p>
                                              </div>
                                          </button>
                                          <button onClick={() => setConfirmingRemoveFriend(friend)} className="p-2 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition" aria-label={`${t('removeFriend')} ${friend.name}`}>
                                              <XIcon className="w-5 h-5"/>
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              )}
              {activeTab === 'comments' && (
                 <div className="space-y-4">
                    <div className="flex items-start gap-2">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
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
                                <span>{t('postComment')}</span>
                            </button>
                        </div>
                    </div>
                     {user.comments.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">{t('noCommentsYet')}</p>
                    ) : (
                        [...user.comments].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(comment => (
                            <div key={comment.id} className="flex items-start gap-3">
                                <button onClick={() => onViewProfile(comment.authorId)} disabled={comment.authorId === user.id} className="disabled:cursor-default flex-shrink-0">
                                    <img src={comment.authorAvatar} alt={comment.authorName} className="w-10 h-10 rounded-full" />
                                </button>
                                <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg relative group min-w-0">
                                    <div className="flex items-baseline justify-between">
                                      <button onClick={() => onViewProfile(comment.authorId)} disabled={comment.authorId === user.id} className="font-semibold text-sm disabled:cursor-default text-left">{comment.authorName}</button>
                                      <p className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 mt-1 text-sm whitespace-pre-wrap break-words">{comment.comment}</p>
                                    
                                    {comment.authorId === user.id && (
                                        <button 
                                            onClick={() => setConfirmingDeleteComment(comment)}
                                            className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                 </div>
              )}
          </div>
      </div>
      {confirmingRemoveFriend && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
                <h3 className="text-lg font-bold mb-4">{t('removeFriend')}</h3>
                <p className="mb-6 text-gray-600 dark:text-gray-300">{t('removeFriendConfirmation')}&nbsp;<strong>{confirmingRemoveFriend.name}</strong>?</p>
                <div className="flex gap-4">
                    <button onClick={() => setConfirmingRemoveFriend(null)} className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-lg transition">{t('cancel')}</button>
                    <button onClick={handleConfirmRemove} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition">{t('removeFriend')}</button>
                </div>
            </div>
        </div>
      )}
      {confirmingDeleteComment && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
                <h3 className="text-lg font-bold mb-4">{t('deleteComment')}</h3>
                <p className="mb-6 text-gray-600 dark:text-gray-300">{t('deleteCommentConfirmation')}</p>
                <div className="flex gap-4">
                    <button onClick={() => setConfirmingDeleteComment(null)} className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-lg transition">{t('cancel')}</button>
                    <button onClick={() => handleDeleteComment(confirmingDeleteComment.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition">{t('delete')}</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Player } from '../types';
import { LogoutIcon, StarIcon, UsersIcon, FootballIcon, SettingsIcon, CameraIcon, UserGroupIcon, UserPlusIcon, LoadingSpinner, XIcon } from '../components/icons';
import { useSettings } from '../contexts/SettingsContext';
import { SettingsPanel } from '../components/SettingsPanel';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, documentId, arrayRemove } from 'firebase/firestore';


interface ProfileScreenProps {
  user: Player;
  onLogout: () => void;
  onUpdateUser: (user: Player) => void;
  onSendFriendRequest: (targetUser: Player) => void;
  onRemoveFriend: (friend: Player) => void;
}

type ProfileTab = 'stats' | 'friends';

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg">
            {icon}
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{label}</p>
    </div>
);

const chunk = <T,>(arr: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
);

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout, onUpdateUser, onSendFriendRequest, onRemoveFriend }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedHandle, setEditedHandle] = useState(user.handle);
  const [editError, setEditError] = useState('');
  
  const [activeTab, setActiveTab] = useState<ProfileTab>('stats');
  
  const [friendsData, setFriendsData] = useState<Player[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [confirmingRemoveFriend, setConfirmingRemoveFriend] = useState<Player | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useSettings();
  
  const handleSave = async () => {
    const newHandle = editedHandle.trim().toLowerCase();
    setEditError('');

    if (newHandle !== user.handle) {
      if (!/^[a-z0-9_]{3,15}$/.test(newHandle)) {
        setEditError(t('invalidHandleError'));
        return;
      }
      const handleQuery = query(collection(db, 'users'), where('handle', '==', newHandle));
      const snapshot = await getDocs(handleQuery);
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
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            const updatedUser = {
              ...user,
              avatar: reader.result,
            };
            onUpdateUser(updatedUser);
        }
      };
      reader.readAsDataURL(file);
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
            const friendsQuery = query(collection(db, 'users'), where(documentId(), 'in', idChunk));
            const snapshot = await getDocs(friendsQuery);
            snapshot.docs.forEach(doc => {
                fetchedFriends.push(doc.data() as Player);
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
  }, [activeTab, fetchFriends, user.friends]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    const queryStr = searchQuery.trim().toLowerCase();
    const handleDbQuery = query(collection(db, 'users'), where('handle', '==', queryStr));
    
    const handleSnapshot = await getDocs(handleDbQuery);

    const results: Player[] = [];
    handleSnapshot.forEach(doc => {
        if(doc.id !== user.id) results.push(doc.data() as Player);
    });

    setSearchResults(results);
    setIsSearching(false);
  };
  
  const getFriendshipStatusButton = (targetUser: Player) => {
    if (user.friends.includes(targetUser.id)) {
      return <span className="text-xs text-gray-400 dark:text-gray-500">{t('alreadyFriends')}</span>
    }
    if (user.friendRequestsSent.includes(targetUser.id)) {
      return <span className="text-xs text-gray-400 dark:text-gray-500">{t('requestSent')}</span>
    }
    if (user.friendRequestsReceived.includes(targetUser.id)) {
        // In a real app, you might want an "Accept" button here too.
        // For now, we direct them to the notification panel.
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
      <div className="h-full w-full flex flex-col p-4 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
          {/* User Info Header */}
          <div className="relative p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-3xl shadow-2xl flex-shrink-0">
              <div className="flex flex-col items-center text-center">
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                    <div className="w-32 h-32 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 p-1 shadow-2xl">
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover transition-opacity group-hover:opacity-75" />
                    </div>
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <CameraIcon className="h-8 w-8 text-white" />
                    </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />

                {!isEditing ? (
                    <div className="mt-4">
                        <h1 className="text-3xl font-bold">{user.name}</h1>
                        <p className="text-gray-500 dark:text-gray-400">@{user.handle}</p>
                    </div>
                ) : (
                    <div className="w-full max-w-xs mt-4 space-y-3">
                        <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} placeholder={t('name')} className="w-full text-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                            <input type="text" value={editedHandle} onChange={(e) => setEditedHandle(e.target.value)} placeholder={t('handle')} className="w-full text-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 pl-7 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        {editError && <p className="text-red-500 text-xs">{editError}</p>}
                         <div className="flex gap-2">
                            <button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-sm">{t('save')}</button>
                            <button onClick={handleCancel} className="flex-1 bg-gray-100 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg text-sm">{t('cancel')}</button>
                        </div>
                    </div>
                )}
              </div>
              
              <div className="absolute top-4 right-4 flex gap-2">
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition" aria-label={t('editProfile')}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                )}
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition" aria-label={t('settings')}>
                    <SettingsIcon />
                </button>
              </div>
          </div>
          
           {/* Tabs */}
          <div className="flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl mt-6 flex-shrink-0 p-2 shadow-lg">
              <button onClick={() => setActiveTab('stats')} className={`flex-1 p-4 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl transition-all duration-300 ${activeTab === 'stats' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>{t('stats')}</button>
              <button onClick={() => setActiveTab('friends')} className={`flex-1 p-4 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl transition-all duration-300 ${activeTab === 'friends' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>{t('friends')}</button>
          </div>
          
          <div className="flex-grow mt-6">
            {activeTab === 'stats' && (
              <div className="grid grid-cols-3 gap-4">
                  <StatCard icon={<UsersIcon className="w-8 h-8"/>} label={t('fieldsVisited')} value={user.stats.fieldsVisited} />
                  <StatCard icon={<FootballIcon />} label={t('gamesPlayed')} value={user.stats.gamesPlayed} />
                  <StatCard icon={<StarIcon className="w-8 h-8" />} label={t('reviewsLeft')} value={user.stats.reviewsLeft} />
              </div>
            )}
            {activeTab === 'friends' && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold mb-3">{t('addFriend')}</h3>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('searchByHandle')} className="flex-grow bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg" disabled={isSearching}>{isSearching ? <LoadingSpinner/> : 'Search'}</button>
                        </form>
                        <div className="mt-4 space-y-2">
                            {searchResults.map(p => (
                                <div key={p.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full" />
                                        <div>
                                            <p className="font-semibold">{p.name}</p>
                                            <p className="text-sm text-gray-500">@{p.handle}</p>
                                        </div>
                                    </div>
                                    {getFriendshipStatusButton(p)}
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
                                        <div className="flex items-center gap-3">
                                            <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full" />
                                            <div>
                                                <p className="font-semibold">{friend.name}</p>
                                                <p className="text-sm text-gray-500">@{friend.handle}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setConfirmingRemoveFriend(friend)}
                                            className="p-2 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition"
                                            aria-label={`${t('removeFriend')} ${friend.name}`}
                                        >
                                            <XIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="mt-auto pt-8 flex-shrink-0">
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <LogoutIcon />
                  <span>{t('logOut')}</span>
              </button>
          </div>
      </div>
      {isSettingsOpen && <SettingsPanel onClose={() => setIsSettingsOpen(false)} />}
      
      {/* Confirmation Modal */}
      {confirmingRemoveFriend && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-bold mb-4">{t('removeFriend')}</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              {t('removeFriendConfirmation')}&nbsp;<strong>{confirmingRemoveFriend.name}</strong>?
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmingRemoveFriend(null)} 
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
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Player, Field, ChatMessage } from '../types';
import { Header } from '../components/Header';
import { TabBar, Tab } from '../components/TabBar';
import { MapScreen } from '../screens/MapScreen';
import { NewsFeedScreen } from '../screens/NewsFeedScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { fetchFootballFields } from '../api/overpass';
import { useSettings } from '../contexts/SettingsContext';
import { db } from '../firebase';
import { collection, doc, setDoc, where, getDocs, writeBatch, documentId, QueryDocumentSnapshot, query, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import L from 'leaflet';
import { NotificationPanel } from '../components/NotificationPanel';
import { ViewProfileModal } from '../components/ViewProfileModal';


interface MainLayoutProps {
  user: Player;
  onLogout: () => void;
  onUpdateUser: (user: Player) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout, onUpdateUser }) => {
  console.log('MainLayout render - user:', user ? user.name : 'null');
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [activeChatField, setActiveChatField] = useState<Field | null>(null);
  
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [searchCenter, setSearchCenter] = useState<L.LatLng | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    surface: 'all',
    rating: 0,
    radius: 5000, // in meters
    showFavorites: false,
    minPlayers: 0,
  });
  
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [viewedPlayer, setViewedPlayer] = useState<Player | null>(null);

  const { t } = useSettings();

  const tabTitles: Record<Tab, string> = {
    map: 'Kickora',
    feed: 'News Feed',
    profile: t('profileTitle'),
  };

  const handleUpdateField = async (updatedField: Field) => {
    // Optimistically update the local state first for a snappy UI
    setFields(prevFields => prevFields.map(f => f.id === updatedField.id ? updatedField : f));
    if (selectedField?.id === updatedField.id) {
        setSelectedField(updatedField);
    }
    if (activeChatField?.id === updatedField.id) {
        setActiveChatField(updatedField);
    }

    // Then, update Firestore in the background
    const fieldRef = doc(db, "fields", updatedField.id.toString());
    try {
        await setDoc(fieldRef, updatedField, { merge: true });
    } catch (error) {
        console.error("Error updating field in Firestore:", error);
    }
  };
  
  const handleUserCheckIn = async (fieldToJoin: Field) => {
    const currentFieldId = user.currentFieldId;
    const newFieldId = fieldToJoin.id;

    if (currentFieldId === newFieldId) return;

    try {
        const batch = writeBatch(db);
        const userRef = doc(db, "users", user.id);

        // Step 1: Handle checkout from the current field if necessary
        if (currentFieldId) {
            const oldFieldRef = doc(db, "fields", currentFieldId.toString());
            const oldFieldDoc = await getDoc(oldFieldRef); // Read the current state of the old field
            if (oldFieldDoc.exists()) {
                const players = (oldFieldDoc.data().players as Player[]).filter(p => p.id !== user.id);
                batch.update(oldFieldRef, { players });
            }
        }

        // Step 2: Handle check-in to the new field
        const newFieldRef = doc(db, "fields", newFieldId.toString());
        batch.update(newFieldRef, { players: arrayUnion(user) }); // arrayUnion is safe

        // Step 3: Update user's profile
        const updatedStats = {
            ...user.stats,
            gamesPlayed: user.stats.gamesPlayed + 1, // Always increment on a new check-in/switch
        };
        batch.update(userRef, { currentFieldId: newFieldId, stats: updatedStats });
        
        // All database operations are prepared, now commit them.
        await batch.commit();

        // Step 4: Update local state for a smooth UX
        const updatedUser = { ...user, currentFieldId: newFieldId, stats: updatedStats };
        onUpdateUser(updatedUser);

        setFields(prevFields => {
            let updatedFields = [...prevFields];
            
            // Update local players list for old field
            if (currentFieldId) {
                const oldFieldIndex = updatedFields.findIndex(f => f.id === currentFieldId);
                if (oldFieldIndex !== -1) {
                    updatedFields[oldFieldIndex] = {
                        ...updatedFields[oldFieldIndex],
                        players: updatedFields[oldFieldIndex].players.filter(p => p.id !== user.id)
                    };
                }
            }

            // Update local players list for new field
            const newFieldIndex = updatedFields.findIndex(f => f.id === newFieldId);
            if (newFieldIndex !== -1) {
                const alreadyCheckedIn = updatedFields[newFieldIndex].players.some(p => p.id === user.id);
                if (!alreadyCheckedIn) {
                    updatedFields[newFieldIndex] = {
                        ...updatedFields[newFieldIndex],
                        players: [...updatedFields[newFieldIndex].players, user]
                    };
                }
            }
            return updatedFields;
        });

        if (selectedField && selectedField.id === newFieldId) {
          setSelectedField(prev => {
              if (!prev) return null;
              const alreadyCheckedIn = prev.players.some(p => p.id === user.id);
              return {
                  ...prev,
                  players: alreadyCheckedIn ? prev.players : [...prev.players, user]
              };
          });
      }
    } catch (error) {
        console.error("Failed to check in:", error);
        alert("There was an error trying to check in. Please try again.");
    }
  };
  
  const handleUserCheckOut = async (fieldToLeave: Field) => {
      setFields(prevFields => {
          const newFields = [...prevFields];
          const fieldIndex = newFields.findIndex(f => f.id === fieldToLeave.id);
          if (fieldIndex > -1) {
              const field = newFields[fieldIndex];
              const updatedPlayers = field.players.filter(p => p.id !== user.id);
              newFields[fieldIndex] = { ...field, players: updatedPlayers };
              
              const fieldRef = doc(db, "fields", field.id.toString());
              setDoc(fieldRef, newFields[fieldIndex], { merge: true }).catch(e => console.error("Failed to update field on checkout", e));
          }
          return newFields;
      });
  
      await onUpdateUser({ ...user, currentFieldId: null });
  };
  
  const handleOpenChat = (field: Field) => {
      setActiveChatField(field);
  };
  
  const handleCloseChat = () => {
      setActiveChatField(null);
  };
  
  const handleSendFriendRequest = async (targetUser: Player) => {
      if(user.friends.includes(targetUser.id) || user.friendRequestsSent.includes(targetUser.id)) return;

      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, { friendRequestsSent: arrayUnion(targetUser.id) });

      const targetUserRef = doc(db, "users", targetUser.id);
      await updateDoc(targetUserRef, { friendRequestsReceived: arrayUnion(user.id) });

      onUpdateUser({ ...user, friendRequestsSent: [...user.friendRequestsSent, targetUser.id] });
  };
  
  const handleAcceptFriendRequest = async (requesterId: string) => {
      // Update both users in Firestore
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
          friends: arrayUnion(requesterId),
          friendRequestsReceived: arrayRemove(requesterId)
      });
      
      const requesterRef = doc(db, "users", requesterId);
      await updateDoc(requesterRef, {
          friends: arrayUnion(user.id),
          friendRequestsSent: arrayRemove(user.id)
      });
      
      // Update local state
      onUpdateUser({
          ...user,
          friends: [...user.friends, requesterId],
          friendRequestsReceived: user.friendRequestsReceived.filter(id => id !== requesterId)
      });
  };

  const handleDeclineFriendRequest = async (requesterId: string) => {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, { friendRequestsReceived: arrayRemove(requesterId) });
      
      const requesterRef = doc(db, "users", requesterId);
      await updateDoc(requesterRef, { friendRequestsSent: arrayRemove(user.id) });
      
      onUpdateUser({
          ...user,
          friendRequestsReceived: user.friendRequestsReceived.filter(id => id !== requesterId)
      });
  };

  const handleRemoveFriend = async (friendToRemove: Player) => {
    // The confirmation dialog is now handled in ProfileScreen to allow for optimistic UI updates.
    try {
        const batch = writeBatch(db);
        
        const userRef = doc(db, "users", user.id);
        batch.update(userRef, { friends: arrayRemove(friendToRemove.id) });

        const friendRef = doc(db, "users", friendToRemove.id);
        batch.update(friendRef, { friends: arrayRemove(user.id) });

        await batch.commit();

        onUpdateUser({
            ...user,
            friends: user.friends.filter(id => id !== friendToRemove.id)
        });
    } catch (error) {
        console.error("Failed to remove friend:", error);
        alert("An error occurred while trying to remove friend.");
    }
  };


  const handleFetchFields = useCallback(async (centerOverride?: L.LatLng) => {
    const center = centerOverride || map?.getCenter();
    if (!center) return;

    setSearchCenter(center);
    setIsFetching(true);
    setFetchError(null);

    try {
        const overpassFields = await fetchFootballFields(center, filters.radius);
        if (overpassFields.length === 0) {
            setFields([]); 
            setIsFetching(false);
            return;
        }

        const overpassFieldMap = new Map<number, Field>();
        overpassFields.forEach(f => overpassFieldMap.set(f.id, f));
        const fieldIds = overpassFields.map(f => f.id.toString());
        
        const chunk = <T,>(arr: T[], size: number): T[][] =>
            Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
                arr.slice(i * size, i * size + size)
            );

        const idChunks = chunk(fieldIds, 30);
        const firestoreDocs: QueryDocumentSnapshot[] = [];
        
        for (const idChunk of idChunks) {
            if (idChunk.length > 0) {
                const fieldsQuery = query(collection(db, 'fields'), where(documentId(), 'in', idChunk));
                const snapshot = await getDocs(fieldsQuery);
                firestoreDocs.push(...snapshot.docs);
            }
        }
        
        const firestoreFields = new Map<number, Field>();
        firestoreDocs.forEach(doc => {
            firestoreFields.set(Number(doc.id), doc.data() as Field);
        });

        const finalFields: Field[] = [];
        const newFieldsToCreate: Field[] = [];

        for (const [id, overpassField] of overpassFieldMap.entries()) {
            const firestoreField = firestoreFields.get(id);

            if (firestoreField) {
                finalFields.push({
                    ...firestoreField,
                    lat: overpassField.lat, 
                    lng: overpassField.lng,
                    name: overpassField.name,
                });
            } else {
                newFieldsToCreate.push(overpassField);
                finalFields.push(overpassField);
            }
        }
        
        if (newFieldsToCreate.length > 0) {
            const batch = writeBatch(db);
            for (const field of newFieldsToCreate) {
                const fieldRef = doc(db, 'fields', field.id.toString());
                batch.set(fieldRef, field);
            }
            await batch.commit();
        }

        setFields(finalFields);

    } catch (error) {
        console.error("Failed to fetch fields:", error);
        setFetchError("Could not load fields. The server might be busy. Please try refreshing.");
    } finally {
        setIsFetching(false);
    }
}, [map, filters.radius]);

  const renderContent = () => {
    switch (activeTab) {
      case 'map':
        return <MapScreen 
                    user={user} 
                    fields={fields}
                    setFields={setFields}
                    selectedField={selectedField}
                    setSelectedField={setSelectedField}
                    onUpdateField={handleUpdateField}
                    onUpdateUser={onUpdateUser}
                    onOpenChat={handleOpenChat}
                    onCheckIn={handleUserCheckIn}
                    onCheckOut={handleUserCheckOut}
                    onViewProfile={setViewedPlayer}
                    isFetching={isFetching}
                    setIsFetching={setIsFetching}
                    fetchError={fetchError}
                    map={map}
                    setMap={setMap}
                    filters={filters}
                    setFilters={setFilters}
                    handleFetchFields={handleFetchFields}
                    searchCenter={searchCenter}
                />;
      case 'feed':
        return <NewsFeedScreen user={user} />;
      case 'profile':
        return <ProfileScreen user={user} onLogout={onLogout} onUpdateUser={onUpdateUser} onSendFriendRequest={handleSendFriendRequest} onRemoveFriend={handleRemoveFriend} />;
      default:
        return <MapScreen 
                    user={user} 
                    fields={fields}
                    setFields={setFields}
                    selectedField={selectedField}
                    setSelectedField={setSelectedField}
                    onUpdateField={handleUpdateField}
                    onUpdateUser={onUpdateUser}
                    onOpenChat={handleOpenChat}
                    onCheckIn={handleUserCheckIn}
                    onCheckOut={handleUserCheckOut}
                    onViewProfile={setViewedPlayer}
                    isFetching={isFetching}
                    setIsFetching={setIsFetching}
                    fetchError={fetchError}
                    map={map}
                    setMap={setMap}
                    filters={filters}
                    setFilters={setFilters}
                    handleFetchFields={handleFetchFields}
                    searchCenter={searchCenter}
                />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Header 
        title={tabTitles[activeTab]} 
        pendingRequestCount={user.friendRequestsReceived.length}
        onToggleNotifications={() => setIsNotificationPanelOpen(prev => !prev)}
      />
      <main className="flex-grow relative">
        {renderContent()}
      </main>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {activeChatField && (
        <ChatScreen
            field={activeChatField}
            currentUser={user}
            onClose={handleCloseChat}
            onUpdateField={handleUpdateField}
        />
      )}
      
      {isNotificationPanelOpen && (
        <NotificationPanel
          currentUser={user}
          onClose={() => setIsNotificationPanelOpen(false)}
          onAccept={handleAcceptFriendRequest}
          onDecline={handleDeclineFriendRequest}
        />
      )}

      {viewedPlayer && (
        <ViewProfileModal
            currentUser={user}
            viewedUser={viewedPlayer}
            onClose={() => setViewedPlayer(null)}
            onSendFriendRequest={handleSendFriendRequest}
        />
      )}
    </div>
  );
};

import React, { useState, useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Player, Field, ChatMessage, ProfileComment, Notification, FieldPlayer, DirectChat } from '../types';
import { Header } from '../components/Header';
import { TabBar, Tab } from '../components/TabBar';
import { MapScreen } from '../screens/MapScreen';
import { NewsFeedScreen } from '../screens/NewsFeedScreen';
import { ProfileScreen, ProfileTab } from '../screens/ProfileScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ChatsListScreen } from '../screens/ChatsListScreen';
import { DirectChatScreen } from '../screens/DirectChatScreen';
import { ServicesScreen } from '../screens/ServicesScreen';
import { FavoriteFieldsScreen } from '../screens/FavoriteFieldsScreen';
import { PlayerCardScreen } from '../screens/PlayerCardScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { MissionsScreen } from '../screens/MissionsScreen';
import { fetchFootballFields } from '../api/overpass';
import { useSettings } from '../contexts/SettingsContext';
import { db } from '../firebase';
// FIX: Use Firebase v8 compat imports
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { NotificationPanel } from '../components/NotificationPanel';
import { ViewProfileModal } from '../components/ViewProfileModal';
import { AddressSearch } from '../components/AddressSearch';
import { SettingsPanel } from '../components/SettingsPanel';


interface MainLayoutProps {
  user: Player;
  onLogout: () => void;
  onUpdateUser: (user: Player) => void;
}

type MainTab = Tab | 'profile';
type ViewingScreen = 'none' | 'favorites' | 'playerCard' | 'leaderboard' | 'missions';

const hydratePlayer = (playerData: Partial<Player>): Player => {
  // Gracefully handle cases where playerData is null or undefined.
  if (!playerData) {
    playerData = {};
  }
  const id = playerData.id ?? `unknown-${Math.random()}`;
  return {
    id: id,
    name: playerData.name ?? 'Player',
    handle: playerData.handle ?? 'player',
    email: playerData.email ?? '',
    avatar: playerData.avatar ?? `https://i.pravatar.cc/150?u=${id}`,
    joinDate: playerData.joinDate ?? new Date().toISOString(),
    stats: { gamesPlayed: 0, fieldsVisited: 0, reviewsLeft: 0, missionPoints: 0, ...(playerData.stats || {}) },
    authProvider: playerData.authProvider,
    favoriteFields: playerData.favoriteFields ?? [],
    friends: playerData.friends ?? [],
    friendRequestsSent: playerData.friendRequestsSent ?? [],
    friendRequestsReceived: playerData.friendRequestsReceived ?? [],
    currentFieldId: playerData.currentFieldId !== undefined ? playerData.currentFieldId : null,
    checkInTime: playerData.checkInTime ?? null,
    comments: playerData.comments ?? [],
    rating: playerData.rating ?? 50,
    level: playerData.level ?? 1,
    experience: playerData.experience ?? 0,
    achievements: playerData.achievements ?? [],
    playerCard: playerData.playerCard ?? {
      id: `card-${id}`,
      playerId: id,
      rarity: 'bronze',
      overallRating: playerData.rating || 50,
      characteristics: { speed: 50, shooting: 50, passing: 50, defending: 50, stamina: 50, technique: 50 },
      specialAbilities: [],
      isSpecial: false
    },
    completedMissions: playerData.completedMissions ?? [],
  };
};

const chunk = <T,>(arr: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
);


export const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<MainTab>('map');
  const [initialProfileTab, setInitialProfileTab] = useState<ProfileTab>();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [activeChatField, setActiveChatField] = useState<Field | null>(null);
  const [activeDirectChatPartner, setActiveDirectChatPartner] = useState<Player | null>(null);
  const [directChats, setDirectChats] = useState<DirectChat[]>([]);
  
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [searchCenter, setSearchCenter] = useState<L.LatLng | null>(null);
  const [filters, setFilters] = useState({
    radius: 2500,
    showFavorites: false,
    minPlayers: 0,
    minRating: 0,
    hasTournaments: false,
    isOpen: false,
    surface: 'all',
    lighting: false,
    size: 'all',
  });
  
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [commentNotifications, setCommentNotifications] = useState<Notification[]>([]);
  const [friendRequesters, setFriendRequesters] = useState<Player[]>([]);
  const [viewedPlayer, setViewedPlayer] = useState<Player | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [viewingScreen, setViewingScreen] = useState<ViewingScreen>('none');

  const { t } = useSettings();

  useEffect(() => {
    if (!user.id) return;

    // Listen for the 20 most recent field chats to ensure they are always available.
    const unsubscribe = db.collection('fields')
      .orderBy('lastMessage.timestamp', 'desc')
      .limit(20)
      .onSnapshot(snapshot => {
        const chattedFields: Field[] = [];
        snapshot.forEach(doc => {
          if (doc.data().lastMessage) {
            chattedFields.push({ id: Number(doc.id), ...doc.data() } as Field);
          }
        });

        setFields(prevFields => {
          const fieldMap = new Map<number, Field>();
          prevFields.forEach(f => fieldMap.set(f.id, f));
          chattedFields.forEach(f => fieldMap.set(f.id, f));
          return Array.from(fieldMap.values());
        });
      }, error => {
        console.error("Error fetching recent chats:", error);
      });

    return () => unsubscribe();
  }, [user.id]);


  useEffect(() => {
    if (!user.id) return;

    const fetchSupplementalFields = async () => {
        const allIdsToFetch = new Set<string>();
        
        (user.favoriteFields || []).forEach(id => allIdsToFetch.add(String(id)));
        
        const currentFieldsMap = new Map<number, Field>();
        fields.forEach(f => currentFieldsMap.set(f.id, f));

        const finalIdsToFetch = Array.from(allIdsToFetch).filter(id => !currentFieldsMap.has(Number(id)));
        
        if (finalIdsToFetch.length === 0) {
            return;
        }

        const idChunks = chunk(finalIdsToFetch, 30);
        for (const idChunk of idChunks) {
            if (idChunk.length > 0) {
                try {
                    const q = db.collection("fields").where(firebase.firestore.FieldPath.documentId(), "in", idChunk);
                    const querySnapshot = await q.get();
                    querySnapshot.forEach((doc) => {
                        currentFieldsMap.set(Number(doc.id), doc.data() as Field);
                    });
                } catch (e) {
                    console.error("Failed to fetch supplemental fields:", e);
                }
            }
        }
        
        setFields(Array.from(currentFieldsMap.values()));
    };

    fetchSupplementalFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, JSON.stringify(user.favoriteFields)]);

  
  const handleViewProfile = useCallback(async (playerOrId: Player | string) => {
    if (!playerOrId) {
      setViewedPlayer(null);
      return;
    }

    const playerId = typeof playerOrId === 'string' ? playerOrId : playerOrId.id;

    // Do not open modal for current user, instead navigate to profile tab
    if (playerId === user.id) {
      setInitialProfileTab('stats');
      setActiveTab('profile');
      if (viewedPlayer) setViewedPlayer(null); // Close modal if open
      return;
    }

    try {
      const userRef = db.collection("users").doc(playerId);
      const userSnap = await userRef.get();
      
      if (userSnap.exists) {
        const latestUserData = hydratePlayer(userSnap.data() as Partial<Player>);
        setViewedPlayer(latestUserData);
      } else {
        console.warn(`User with id ${playerId} not found`);
        // Fallback to the potentially stale data if user object was passed
        if (typeof playerOrId !== 'string') {
          setViewedPlayer(playerOrId);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Fallback to the potentially stale data on error
      if (typeof playerOrId !== 'string') {
        setViewedPlayer(playerOrId);
      }
    }
  }, [user.id, setActiveTab, viewedPlayer]);

  useEffect(() => {
    if (!user.id) return;

    // The query now only filters by recipientId. Sorting will happen on the client.
    const notificationsQuery = db.collection('notifications')
      .where('recipientId', '==', user.id);

    const unsubscribe = notificationsQuery.onSnapshot(snapshot => {
      const newNotifications: Notification[] = [];
      snapshot.forEach(doc => {
        const notification = { id: doc.id, ...doc.data() } as Notification;
        if (!notification.read) {
          newNotifications.push(notification);
        }
      });
      // Sort notifications by date descending on the client
      newNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCommentNotifications(newNotifications);
    }, error => {
        console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [user.id]);

  useEffect(() => {
    if (!user.id) return;

    const q = db.collection('directChats').where('participants', 'array-contains', user.id);

    const unsubscribe = q.onSnapshot(snapshot => {
      const newChats: DirectChat[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        newChats.push({
            id: doc.id,
            participants: data.participants,
            participantInfo: data.participantInfo,
            // messages: data.messages || [], // Messages are now in a subcollection
            lastMessage: data.lastMessage
        } as DirectChat);
      });
      setDirectChats(newChats);
    }, error => {
        console.error("Error fetching direct chats:", error);
    });

    return () => unsubscribe();
  }, [user.id]);

  useEffect(() => {
    const fetchRequesters = async () => {
      if (user.friendRequestsReceived.length === 0) {
        setFriendRequesters([]);
        return;
      }
      
      const idChunks = chunk(user.friendRequestsReceived, 30);
      const fetchedRequesters: Player[] = [];
      
      for (const idChunk of idChunks) {
          if (idChunk.length > 0) {
              const q = db.collection("users").where(firebase.firestore.FieldPath.documentId(), "in", idChunk);
              const querySnapshot = await q.get();
              querySnapshot.forEach((doc) => {
                  fetchedRequesters.push(hydratePlayer(doc.data() as Partial<Player>));
              });
          }
      }
      setFriendRequesters(fetchedRequesters);
    };

    fetchRequesters();
  }, [user.friendRequestsReceived]);

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
    // FIX: Use v8 compat Firestore syntax
    const fieldRef = db.collection("fields").doc(updatedField.id.toString());
    try {
        // Exclude chat from being written back to the document. It's a subcollection now.
        const { chat, ...fieldData } = updatedField as any;
        // FIX: Use v8 compat Firestore syntax
        await fieldRef.set(fieldData, { merge: true });
    } catch (error) {
        console.error("Error updating field in Firestore:", error);
    }
  };
  
  const handleUserCheckIn = async (fieldToJoin: Field) => {
    const currentFieldId = user.currentFieldId;
    const newFieldId = fieldToJoin.id;
    const checkInTime = new Date().toISOString();

    if (currentFieldId === newFieldId) return;

    try {
        await db.runTransaction(async transaction => {
            const userRef = db.collection("users").doc(user.id);
            const newFieldRef = db.collection("fields").doc(newFieldId.toString());

            // --- All reads must happen before all writes ---
            
            // Read the new field first
            const newFieldDoc = await transaction.get(newFieldRef);
            if (!newFieldDoc.exists) {
                throw "Field does not exist!";
            }

            // Read the old field if there is one
            let oldFieldDoc: firebase.firestore.DocumentSnapshot | null = null;
            let oldFieldRef: firebase.firestore.DocumentReference | null = null;
            if (currentFieldId) {
                oldFieldRef = db.collection("fields").doc(currentFieldId.toString());
                oldFieldDoc = await transaction.get(oldFieldRef);
            }

            // --- All writes happen after all reads ---

            // Step 1: Update the old field to remove the user
            if (oldFieldRef && oldFieldDoc && oldFieldDoc.exists) {
                const players = (oldFieldDoc.data()!.players as FieldPlayer[] || []).filter(p => p.id !== user.id);
                transaction.update(oldFieldRef, { players });
            }

            // Step 2: Update the new field to add the user
            const fieldPlayer: FieldPlayer = {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                checkInTime,
            };
            const newPlayers = (newFieldDoc.data()!.players as FieldPlayer[] || []).filter(p => p.id !== user.id);
            newPlayers.push(fieldPlayer);
            transaction.update(newFieldRef, { players: newPlayers });
            
            // Step 3: Update the user's profile
            transaction.update(userRef, { currentFieldId: newFieldId, checkInTime });
        });

        // Step 4: Update local state for a smooth UX
        const updatedUser = { ...user, currentFieldId: newFieldId, checkInTime };
        onUpdateUser(updatedUser);

        const updatedFieldPlayerArray: FieldPlayer = {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            checkInTime
        };

        setFields(prevFields => {
            return prevFields.map(f => {
                // Remove from old field
                if (f.id === currentFieldId) {
                    return { ...f, players: f.players.filter(p => p.id !== user.id) };
                }
                // Add to new field
                if (f.id === newFieldId) {
                    const otherPlayers = f.players.filter(p => p.id !== user.id);
                    // FIX: The previous code was spreading an array of players (`otherPlayers`)
                    // into the field object, which is incorrect. This spreads the field `f`
                    // itself and overrides the `players` array.
                    return { ...f, players: [...otherPlayers, updatedFieldPlayerArray] };
                }
                return f;
            });
        });
        
        if (selectedField) {
            setSelectedField(prev => {
                if (!prev) return null;
                // Field we are leaving
                if (prev.id === currentFieldId) {
                    return { ...prev, players: prev.players.filter(p => p.id !== user.id) };
                }
                // Field we are joining
                if (prev.id === newFieldId) {
                    const playersWithoutUser = prev.players.filter(p => p.id !== user.id);
                    return { ...prev, players: [...playersWithoutUser, updatedFieldPlayerArray] };
                }
                return prev;
            });
        }
    } catch (error) {
        console.error("Failed to check in:", error);
        alert("There was an error trying to check in. Please try again.");
    }
  };
  
  const handleUserCheckOut = async (fieldToLeave: Field) => {
    const fieldId = fieldToLeave.id;

    try {
        await db.runTransaction(async transaction => {
            const userRef = db.collection("users").doc(user.id);
            const fieldRef = db.collection("fields").doc(fieldId.toString());

            // --- Reads ---
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new Error("User document not found during checkout");
            }
            const userData = userDoc.data() as Player;
            const checkInTime = userData.checkInTime;
            
            const fieldDoc = await transaction.get(fieldRef);
            
            // --- Writes ---
            if (fieldDoc.exists) {
                const players = (fieldDoc.data()!.players as FieldPlayer[] || []).filter(p => p.id !== user.id);
                transaction.update(fieldRef, { players });
            } else {
                 console.warn(`Field ${fieldId} not found during checkout, but clearing user state.`);
            }

            const userUpdate: { [key: string]: any } = { currentFieldId: null, checkInTime: null };
            if (checkInTime) {
                const durationMs = new Date().getTime() - new Date(checkInTime).getTime();
                const fifteenMinutesMs = 15 * 60 * 1000;
                if (durationMs >= fifteenMinutesMs) {
                    userUpdate.stats = { ...userData.stats, fieldsVisited: (userData.stats.fieldsVisited || 0) + 1 };
                }
            }
            transaction.update(userRef, userUpdate);
        });

        // --- UI updates after successful transaction ---
        const checkInTime = user.checkInTime;
        let shouldIncrementStat = false;
        if (checkInTime) {
            const durationMs = new Date().getTime() - new Date(checkInTime).getTime();
            const fifteenMinutesMs = 15 * 60 * 1000;
            if (durationMs >= fifteenMinutesMs) {
                shouldIncrementStat = true;
            }
        }
        
        const updatedUser = { ...user, currentFieldId: null, checkInTime: null };
        if (shouldIncrementStat) {
            updatedUser.stats = { ...user.stats, fieldsVisited: (user.stats.fieldsVisited || 0) + 1 };
        }
        onUpdateUser(updatedUser);

        setFields(prevFields => {
            return prevFields.map(f => {
                if (f.id === fieldId) {
                    return { ...f, players: f.players.filter(p => p.id !== user.id) };
                }
                return f;
            });
        });

        if (selectedField?.id === fieldId) {
            setSelectedField(prev => {
                if (!prev) return null;
                return { ...prev, players: prev.players.filter(p => p.id !== user.id) };
            });
        }
    } catch (error) {
        console.error("Failed to check out:", error);
        alert("There was an error trying to check out. Please try again.");
    }
  };
  
  const handleOpenChat = (field: Field) => {
      setActiveDirectChatPartner(null);
      setActiveChatField(field);
  };
  
  const handleCloseChat = () => {
      setActiveChatField(null);
  };
  
  const handleOpenDirectChat = (partner: Player) => {
    setActiveChatField(null);
    setViewedPlayer(null);
    setActiveDirectChatPartner(partner);
  };

  const handleCloseDirectChat = () => {
      setActiveDirectChatPartner(null);
  };

  const handleSendFriendRequest = async (targetUser: Player) => {
      if(user.friends.includes(targetUser.id) || user.friendRequestsSent.includes(targetUser.id)) return;

      // FIX: Use v8 compat Firestore syntax
      const userRef = db.collection("users").doc(user.id);
      await userRef.update({ friendRequestsSent: firebase.firestore.FieldValue.arrayUnion(targetUser.id) });

      const targetUserRef = db.collection("users").doc(targetUser.id);
      await targetUserRef.update({ friendRequestsReceived: firebase.firestore.FieldValue.arrayUnion(user.id) });

      onUpdateUser({ ...user, friendRequestsSent: [...user.friendRequestsSent, targetUser.id] });
  };
  
  const handleAcceptFriendRequest = async (requesterId: string) => {
      // Update both users in Firestore
      // FIX: Use v8 compat Firestore syntax
      const userRef = db.collection("users").doc(user.id);
      await userRef.update({
          friends: firebase.firestore.FieldValue.arrayUnion(requesterId),
          friendRequestsReceived: firebase.firestore.FieldValue.arrayRemove(requesterId)
      });
      
      const requesterRef = db.collection("users").doc(requesterId);
      await requesterRef.update({
          friends: firebase.firestore.FieldValue.arrayUnion(user.id),
          friendRequestsSent: firebase.firestore.FieldValue.arrayRemove(user.id)
      });
      
      // Update local state
      onUpdateUser({
          ...user,
          friends: [...user.friends, requesterId],
          friendRequestsReceived: user.friendRequestsReceived.filter(id => id !== requesterId)
      });
  };

  const handleDeclineFriendRequest = async (requesterId: string) => {
      // FIX: Use v8 compat Firestore syntax
      const userRef = db.collection("users").doc(user.id);
      await userRef.update({ friendRequestsReceived: firebase.firestore.FieldValue.arrayRemove(requesterId) });
      
      const requesterRef = db.collection("users").doc(requesterId);
      await requesterRef.update({ friendRequestsSent: firebase.firestore.FieldValue.arrayRemove(user.id) });
      
      onUpdateUser({
          ...user,
          friendRequestsReceived: user.friendRequestsReceived.filter(id => id !== requesterId)
      });
  };

  const handleRemoveFriend = async (friendToRemove: Player) => {
    // The confirmation dialog is now handled in ProfileScreen to allow for optimistic UI updates.
    try {
        // FIX: Use v8 compat Firestore syntax
        const batch = db.batch();
        
        const userRef = db.collection("users").doc(user.id);
        batch.update(userRef, { friends: firebase.firestore.FieldValue.arrayRemove(friendToRemove.id) });

        const friendRef = db.collection("users").doc(friendToRemove.id);
        batch.update(friendRef, { friends: firebase.firestore.FieldValue.arrayRemove(user.id) });

        await batch.commit();

        onUpdateUser({
            ...user,
            friends: user.friends.filter(id => id !== friendToRemove.id)
        });
        if (viewedPlayer && viewedPlayer.id === friendToRemove.id) {
            setViewedPlayer(null);
            setTimeout(() => setViewedPlayer(friendToRemove), 0); // Force re-render of modal
        }
    } catch (error) {
        console.error("Failed to remove friend:", error);
        alert("An error occurred while trying to remove friend.");
    }
  };
  
  const handleUpdateOtherUser = async (targetUser: Player, commentText: string) => {
    const newComment: ProfileComment = {
        id: `comment-${Date.now()}`,
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar,
        comment: commentText,
        createdAt: new Date().toISOString()
    };

    const targetUserRef = db.collection("users").doc(targetUser.id);
    await targetUserRef.update({
        comments: firebase.firestore.FieldValue.arrayUnion(newComment)
    });

    if (targetUser.id !== user.id) {
        const notification: Omit<Notification, 'id'> = {
            type: 'NEW_COMMENT',
            recipientId: targetUser.id,
            senderId: user.id,
            senderName: user.name,
            senderAvatar: user.avatar,
            commentText: commentText,
            read: false,
            createdAt: new Date().toISOString()
        };
        db.collection("notifications").add(notification);
    }

    if (viewedPlayer && viewedPlayer.id === targetUser.id) {
        setViewedPlayer(prev => prev ? ({ ...prev, comments: [newComment, ...prev.comments] }) : null);
    }
  };

  const handleMarkCommentAsRead = async (notificationId: string) => {
    const notifRef = db.collection("notifications").doc(notificationId);
    await notifRef.update({ read: true });
  };

   const handleFetchFields = useCallback(async (centerOverride?: L.LatLng) => {
    const center = centerOverride || map?.getCenter();
    if (!center) return;

    setSearchCenter(center);
    setIsFetching(true);
    setFetchError(null);

    try {
        const { fields: overpassFields, images } = await fetchFootballFields(center, filters.radius);
        if (overpassFields.length === 0) {
            setFields(prev => {
                const existingMap = new Map(prev.map(f => [f.id, f]));
                return Array.from(existingMap.values()); // Keep existing favorites/chatted fields
            });
            setIsFetching(false);
            return;
        }

        const overpassFieldMap = new Map<number, Field>();
        overpassFields.forEach(f => overpassFieldMap.set(f.id, f));
        const fieldIds = overpassFields.map(f => f.id.toString());
        
        const idChunks = chunk(fieldIds, 30);
        const firestoreDocs: firebase.firestore.QueryDocumentSnapshot[] = [];
        
        for (const idChunk of idChunks) {
            if (idChunk.length > 0) {
                const fieldsQuery = db.collection('fields').where(firebase.firestore.FieldPath.documentId(), 'in', idChunk);
                const snapshot = await fieldsQuery.get();
                firestoreDocs.push(...snapshot.docs);
            }
        }
        
        const firestoreFields = new Map<number, Field>();
        firestoreDocs.forEach(doc => {
            const fieldData = doc.data() as Field;
            firestoreFields.set(Number(doc.id), fieldData);
        });

        const finalFields: Field[] = [];
        const batch = db.batch();

        for (const [id, overpassField] of overpassFieldMap.entries()) {
            const firestoreField = firestoreFields.get(id);

            if (firestoreField) {
                 // MERGE LOGIC
                const hasRealName = firestoreField.name && !firestoreField.name.startsWith('Стадион (') && firestoreField.name !== 'Стадион без названия';
                
                // Create the merged field object but explicitly exclude 'chat'
                const { chat, ...existingData } = firestoreField as any;
                const mergedField: Field = {
                    ...(existingData as Field),
                    lat: overpassField.lat,
                    lng: overpassField.lng,
                    name: hasRealName ? firestoreField.name : overpassField.name,
                };

                if ((!mergedField.photo || mergedField.photo.includes('unsplash')) && images.length > 0) {
                    mergedField.photo = images[Math.floor(Math.random() * images.length)];
                    const fieldRef = db.collection('fields').doc(mergedField.id.toString());
                    batch.update(fieldRef, { photo: mergedField.photo });
                }
                
                finalFields.push(mergedField);
            } else {
                // NEW FIELD LOGIC
                const fieldRef = db.collection('fields').doc(overpassField.id.toString());
                batch.set(fieldRef, overpassField);
                finalFields.push(overpassField);
            }
        }
        
        await batch.commit();

        setFields(prevFields => {
            const fieldMap = new Map<number, Field>();
            // Add existing fields (favorites, chatted) first
            prevFields.forEach(f => fieldMap.set(f.id, f));
            // Overwrite/add fields from current map fetch
            finalFields.forEach(f => fieldMap.set(f.id, f));
            return Array.from(fieldMap.values());
        });

    } catch (error) {
        console.error("Failed to fetch fields:", error);
        setFetchError("Could not load fields. The server might be busy. Please try refreshing.");
    } finally {
        setIsFetching(false);
    }
  }, [map, filters.radius, setFields]);

   const handleAddressSelect = (lat: number, lng: number) => {
    if (map) {
      const newCenter = new L.LatLng(lat, lng);
      map.setView(newCenter, 14);
      setSearchCenter(newCenter);
      handleFetchFields(newCenter);
    }
    setIsSearchOpen(false);
  };
  
  const pendingRequestCount = friendRequesters.length + commentNotifications.length;

  const handleGoToProfile = () => {
    setInitialProfileTab(undefined);
    setActiveTab('profile');
  };

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
                    onViewProfile={handleViewProfile}
                    isFetching={isFetching}
                    setIsFetching={setIsFetching}
                    fetchError={fetchError}
                    map={map}
                    setMap={setMap}
                    filters={filters}
                    setFilters={setFilters}
                    handleFetchFields={handleFetchFields}
                    searchCenter={searchCenter}
                    setSearchCenter={setSearchCenter}
                />;
      case 'feed':
        return <NewsFeedScreen 
                    user={user} 
                    fields={fields} 
                    onViewProfile={handleViewProfile}
                    setSelectedField={setSelectedField}
                    setActiveTab={setActiveTab}
                />;
      case 'chats':
        return <ChatsListScreen 
                  user={user}
                  fields={fields}
                  directChats={directChats}
                  onOpenChat={handleOpenChat}
                  onOpenDirectChat={handleOpenDirectChat}
                />;
      case 'services':
        return <ServicesScreen 
                  onNavigateToProfile={(subTab) => {
                    setInitialProfileTab(subTab);
                    setActiveTab('profile');
                  }}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  setActiveTab={setActiveTab}
                  onOpenFavorites={() => setViewingScreen('favorites')}
                  onOpenPlayerCard={() => setViewingScreen('playerCard')}
                  onOpenLeaderboard={() => setViewingScreen('leaderboard')}
                  onOpenMissions={() => setViewingScreen('missions')}
                />;
      case 'profile':
        return <ProfileScreen 
                    user={user} 
                    onLogout={onLogout} 
                    onUpdateUser={onUpdateUser} 
                    onSendFriendRequest={handleSendFriendRequest} 
                    onRemoveFriend={handleRemoveFriend}
                    onViewProfile={handleViewProfile} 
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    initialTab={initialProfileTab}
                />;
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
                    onViewProfile={handleViewProfile}
                    isFetching={isFetching}
                    setIsFetching={setIsFetching}
                    fetchError={fetchError}
                    map={map}
                    setMap={setMap}
                    filters={filters}
                    setFilters={setFilters}
                    handleFetchFields={handleFetchFields}
                    searchCenter={searchCenter}
                    setSearchCenter={setSearchCenter}
                />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-900">
      <Header 
        user={user}
        activeTab={activeTab as Tab}
        setActiveTab={setActiveTab}
        onGoToProfile={handleGoToProfile}
        onLogout={onLogout}
        pendingRequestCount={pendingRequestCount}
        onToggleNotifications={() => setIsNotificationPanelOpen(prev => !prev)}
        onSearchClick={() => setIsSearchOpen(true)}
      />
      <main className="flex-grow relative overflow-hidden">
        {renderContent()}
      </main>
      <TabBar activeTab={activeTab as Tab} setActiveTab={setActiveTab} />
      
      {activeChatField && (
        <ChatScreen
            field={activeChatField}
            currentUser={user}
            onClose={handleCloseChat}
            onUpdateField={handleUpdateField}
        />
      )}

      {activeDirectChatPartner && (
        <DirectChatScreen
            currentUser={user}
            otherUser={activeDirectChatPartner}
            onClose={handleCloseDirectChat}
        />
      )}
      
      {isNotificationPanelOpen && (
        <NotificationPanel
          currentUser={user}
          friendRequesters={friendRequesters}
          commentNotifications={commentNotifications}
          onClose={() => setIsNotificationPanelOpen(false)}
          onAccept={handleAcceptFriendRequest}
          onDecline={handleDeclineFriendRequest}
          onMarkCommentAsRead={handleMarkCommentAsRead}
          onViewProfile={handleViewProfile}
        />
      )}

      {viewedPlayer && (
        <ViewProfileModal
            currentUser={user}
            viewedUser={viewedPlayer}
            onClose={() => setViewedPlayer(null)}
            onSendFriendRequest={handleSendFriendRequest}
            onRemoveFriend={handleRemoveFriend}
            onUpdateOtherUser={handleUpdateOtherUser}
            onViewProfile={handleViewProfile}
            onOpenDirectChat={handleOpenDirectChat}
        />
      )}

      {isSearchOpen && activeTab === 'map' && (
        <AddressSearch
            onLocationSelect={handleAddressSelect}
            onClose={() => setIsSearchOpen(false)}
        />
      )}
      
      {isSettingsOpen && <SettingsPanel onClose={() => setIsSettingsOpen(false)} onLogout={onLogout} />}

      {viewingScreen === 'favorites' && (
        <FavoriteFieldsScreen
          user={user}
          fields={fields}
          onClose={() => setViewingScreen('none')}
          setSelectedField={setSelectedField}
          onNavigateToMap={() => {
            setViewingScreen('none');
            setActiveTab('map');
          }}
        />
      )}
      {viewingScreen === 'playerCard' && (
        <PlayerCardScreen
          user={user}
          onClose={() => setViewingScreen('none')}
        />
      )}
       {viewingScreen === 'leaderboard' && (
        <LeaderboardScreen
          user={user}
          onClose={() => setViewingScreen('none')}
        />
      )}
      {viewingScreen === 'missions' && (
        <MissionsScreen
          user={user}
          onUpdateUser={onUpdateUser}
          onClose={() => setViewingScreen('none')}
        />
      )}
    </div>
  );
};
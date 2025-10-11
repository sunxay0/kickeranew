import React, { useState, useEffect, useCallback } from 'react';
import { Player } from './types';
import { LoginScreen } from './screens/LoginScreen';
import { MainLayout } from './layouts/MainLayout';
import { SettingsProvider } from './contexts/SettingsContext';
import { auth, db } from './firebase';
import { LoadingSpinner } from './components/icons';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';


const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          // User exists, set them as current user
          const userData = userSnap.data();
          // Ensure all properties exist, providing defaults for new fields on old documents
          const completeUser: Player = {
            id: userData.id,
            name: userData.name,
            handle: userData.handle,
            email: userData.email,
            avatar: userData.avatar,
            joinDate: userData.joinDate,
            stats: userData.stats || { gamesPlayed: 0, fieldsVisited: 0, reviewsLeft: 0 },
            authProvider: userData.authProvider,
            favoriteFields: userData.favoriteFields || [],
            friends: userData.friends || [],
            friendRequestsSent: userData.friendRequestsSent || [],
            friendRequestsReceived: userData.friendRequestsReceived || [],
            currentFieldId: userData.currentFieldId !== undefined ? userData.currentFieldId : null,
            // Gamification fields
            rating: userData.rating || 50,
            level: userData.level || 1,
            experience: userData.experience || 0,
            achievements: userData.achievements || [],
            playerCard: userData.playerCard || {
              id: `card-${userData.id}`,
              playerId: userData.id,
              rarity: 'bronze',
              overallRating: userData.rating || 50,
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
            }
          };
          console.log('Existing user loaded:', completeUser);
          setCurrentUser(completeUser);
        } else {
          // New user, create a profile in Firestore
          console.log('Creating new user...');
          const isEmailProvider = firebaseUser.providerData.some(p => p?.providerId === 'password');
          const newUser: Player = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
            handle: firebaseUser.email!.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''),
            email: firebaseUser.email!,
            avatar: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
            joinDate: new Date().toISOString(),
            stats: { gamesPlayed: 0, fieldsVisited: 0, reviewsLeft: 0 },
            authProvider: isEmailProvider ? 'email' : 'google',
            favoriteFields: [],
            friends: [],
            friendRequestsSent: [],
            friendRequestsReceived: [],
            currentFieldId: null,
            // Gamification fields
            rating: 50,
            level: 1,
            experience: 0,
            achievements: [],
            playerCard: {
              id: `card-${firebaseUser.uid}`,
              playerId: firebaseUser.uid,
              rarity: 'bronze',
              overallRating: 50,
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
            }
          };
          await setDoc(userRef, newUser);
          console.log('New user created:', newUser);
          setCurrentUser(newUser);
        }
      } else {
        console.log('No user, showing login screen');
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
        await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  }, []);

  const handleUpdateUser = useCallback(async (updatedUser: Player) => {
    if (!updatedUser) return;
    const userRef = doc(db, "users", updatedUser.id);
    await setDoc(userRef, updatedUser, { merge: true });
    setCurrentUser(updatedUser);
  }, []);

  console.log('App render - authLoading:', authLoading, 'currentUser:', currentUser ? 'exists' : 'null');

  if (authLoading) {
    console.log('Showing loading screen');
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900">
            <LoadingSpinner className="w-10 h-10 text-green-500" />
            <p className="mt-4 text-gray-500">Загрузка...</p>
        </div>
    );
  }

  if (!currentUser) {
    console.log('Showing login screen');
    return <LoginScreen />;
  }

  console.log('Showing main layout for user:', currentUser.name);
  return <MainLayout user={currentUser} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />;
}

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
};

export default App;
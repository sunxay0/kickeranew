import React, { useState, useEffect, useCallback } from 'react';
import { Player, FieldPlayer } from './types';
import { LoginScreen } from './screens/LoginScreen';
import { MainLayout } from './layouts/MainLayout';
import { SettingsProvider } from './contexts/SettingsContext';
import { auth, db } from './firebase';
import { LoadingSpinner } from './components/icons';
// FIX: Use Firebase v8 compat imports
import type firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';


const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const handleUpdateUser = useCallback(async (updatedUser: Player) => {
    if (!updatedUser) return;
    // FIX: Use v8 compat Firestore syntax
    const userRef = db.collection("users").doc(updatedUser.id);
    await userRef.set(updatedUser, { merge: true });
    setCurrentUser(updatedUser);
  }, []);

  const autoCheckout = useCallback(async (userToCheckOut: Player) => {
    const fieldId = userToCheckOut.currentFieldId;
    if (!fieldId) return;

    try {
        await db.runTransaction(async transaction => {
            const userRef = db.collection("users").doc(userToCheckOut.id);
            const fieldRef = db.collection("fields").doc(fieldId.toString());
            const fieldDoc = await transaction.get(fieldRef);

            if (fieldDoc.exists) {
                const players = (fieldDoc.data()!.players as FieldPlayer[] || []).filter(p => p.id !== userToCheckOut.id);
                transaction.update(fieldRef, { players });
            }

            transaction.update(userRef, { currentFieldId: null, checkInTime: null });
        });
        
        handleUpdateUser({ ...userToCheckOut, currentFieldId: null, checkInTime: null });

    } catch (error) {
        console.error("Auto checkout failed", error);
    }
  }, [handleUpdateUser]);

  useEffect(() => {
    const check = () => {
      if (currentUser?.currentFieldId && currentUser.checkInTime) {
          const checkInDate = new Date(currentUser.checkInTime);
          const twelveHoursInMillis = 12 * 60 * 60 * 1000;
          const now = new Date();

          if (now.getTime() - checkInDate.getTime() > twelveHoursInMillis) {
              autoCheckout(currentUser);
          }
      }
    };
    
    check(); // Initial check
    const intervalId = setInterval(check, 60 * 1000); // Check every minute

    return () => clearInterval(intervalId);
  }, [currentUser, autoCheckout]);


  useEffect(() => {
    // FIX: Use v8 compat onAuthStateChanged
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: firebase.User | null) => {
      if (firebaseUser) {
        // FIX: Use v8 compat Firestore syntax
        const userRef = db.collection("users").doc(firebaseUser.uid);
        const userSnap = await userRef.get();

        // FIX: userSnap.exists is a property in v8
        if (userSnap.exists) {
          // User exists, set them as current user
          const userData = userSnap.data()!;
          // Ensure all properties exist, providing defaults for new fields on old documents
          const completeUser: Player = {
            id: userData.id,
            name: userData.name,
            handle: userData.handle,
            email: userData.email,
            avatar: userData.avatar,
            joinDate: userData.joinDate,
            stats: { gamesPlayed: 0, fieldsVisited: 0, reviewsLeft: 0, missionPoints: 0, ...(userData.stats || {}) },
            authProvider: userData.authProvider,
            favoriteFields: userData.favoriteFields || [],
            friends: userData.friends || [],
            friendRequestsSent: userData.friendRequestsSent || [],
            friendRequestsReceived: userData.friendRequestsReceived || [],
            currentFieldId: userData.currentFieldId !== undefined ? userData.currentFieldId : null,
            checkInTime: userData.checkInTime || null,
            comments: userData.comments || [],
            // Gamification fields
            rating: userData.rating || 50,
            level: userData.level || 1,
            experience: userData.experience || 0,
            achievements: userData.achievements || [],
            completedMissions: userData.completedMissions || [],
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
          
          setCurrentUser(completeUser);
        } else {
          // New user, create a profile in Firestore
          const isEmailProvider = firebaseUser.providerData.some(p => p?.providerId === 'password');
          const newUser: Player = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
            handle: firebaseUser.email!.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''),
            email: firebaseUser.email!,
            avatar: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
            joinDate: new Date().toISOString(),
            stats: { gamesPlayed: 0, fieldsVisited: 0, reviewsLeft: 0, missionPoints: 0 },
            authProvider: isEmailProvider ? 'email' : 'google',
            favoriteFields: [],
            friends: [],
            friendRequestsSent: [],
            friendRequestsReceived: [],
            currentFieldId: null,
            checkInTime: null,
            comments: [],
            // Gamification fields
            completedMissions: [],
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
          // FIX: Use v8 compat Firestore syntax
          await userRef.set(newUser);
          setCurrentUser(newUser);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
        // FIX: Use v8 compat signOut
        await auth.signOut();
    } catch (error) {
      console.error("Logout failed", error);
    }
  }, []);

  if (authLoading) {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900">
            <LoadingSpinner className="w-10 h-10 text-green-500" />
        </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

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

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User } from '../types';
import { initializeDefaultData } from '../services/initializeData';

interface AuthContextType {
    user: FirebaseUser | null;
    userProfile: User | null;
    loading: boolean;
    isAdmin: boolean;
    isCoach: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    isAdmin: false,
    isCoach: false,
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (firebaseUser: FirebaseUser) => {
        try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const data = userDoc.data() as User;
                // One-time migration: if academyName is missing, set it to the default
                if (!data.academyName) {
                    try {
                        await updateDoc(userDocRef, { academyName: 'ABC Badminton Academy' });
                        setUserProfile({ ...data, academyName: 'ABC Badminton Academy' });
                    } catch (e) {
                        console.error("Migration error:", e);
                        setUserProfile(data);
                    }
                } else {
                    setUserProfile(data);
                }
            } else {
                console.warn('No user profile found for UID:', firebaseUser.uid);

                const defaultProfile: User = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    role: 'Coach',
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                    academyName: 'ABC Badminton Academy',
                };

                try {
                    await setDoc(userDocRef, defaultProfile);
                    setUserProfile(defaultProfile);
                    // Initialize default data for new user
                    await initializeDefaultData(firebaseUser.uid);
                } catch (createError) {
                    console.error('Error creating user profile:', createError);
                    setUserProfile(null);
                }
            }

            // Initialize default data if user profile exists but data might be missing
            try {
                await initializeDefaultData(firebaseUser.uid);
            } catch (initError) {
                console.error('Error initializing default data:', initError);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await fetchProfile(firebaseUser);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const isAdmin = userProfile?.role === 'SuperAdmin';
    const isCoach = userProfile?.role === 'Coach' || userProfile?.role === 'AssistantCoach';

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, isAdmin, isCoach, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

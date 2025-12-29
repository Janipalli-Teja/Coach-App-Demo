import { collection, query, where, getDocs, getDoc, orderBy, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth as primaryAuth } from './firebase';
import { User, UserRole, Branch, Session } from '../types';

/**
 * Creates a new staff user. 
 * We use a secondary Firebase app instance to create the user so the current admin 
 * session is not terminated.
 */
export const registerStaff = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    academyName: string
): Promise<{ success: boolean; error?: any }> => {
    let secondaryApp;
    try {
        // 1. Initialize a secondary app instance
        const config = (primaryAuth.app as any).options;
        const secondaryAppName = `secondary-app-${Date.now()}`;
        secondaryApp = initializeApp(config, secondaryAppName);

        // Use initializeAuth with persistence to avoid warnings in React Native
        const secondaryAuth = initializeAuth(secondaryApp, {
            persistence: getReactNativePersistence(AsyncStorage)
        });

        // 2. Create the user in Auth
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const uid = userCredential.user.uid;

        // 3. Create the user profile in Firestore
        await setDoc(doc(db, 'users', uid), {
            uid,
            email,
            name,
            role,
            academyName,
            createdAt: new Date().toISOString()
        });

        // 4. Sign out of the secondary app and delete it
        await signOut(secondaryAuth);

        return { success: true };
    } catch (error: any) {
        console.error("Error registering staff:", error);
        return { success: false, error };
    }
};
// Profile Updates
export const updateUserName = async (uid: string, newName: string): Promise<boolean> => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { name: newName });
        return true;
    } catch (error) {
        console.error("Error updating name:", error);
        return false;
    }
};

export const updateAcademyName = async (uid: string, newAcademyName: string): Promise<boolean> => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { academyName: newAcademyName });
        return true;
    } catch (error) {
        console.error("Error updating academy name:", error);
        return false;
    }
};

export const updateUserProfileImage = async (uid: string, profileUrl: string): Promise<boolean> => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { profileUrl });
        return true;
    } catch (error) {
        console.error("Error updating profile image:", error);
        return false;
    }
};

// Staff Management
export const getStaff = async (): Promise<User[]> => {
    try {
        const q = query(collection(db, 'users'), where('role', 'in', ['Coach', 'AssistantCoach']));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    } catch (error) {
        console.error("Error fetching staff:", error);
        return [];
    }
};

export const addStaff = async (staffData: Omit<User, 'uid'>): Promise<string | null> => {
    try {
        // In a real app, you'd use Firebase Admin or a Cloud Function to create the auth user too.
        // For this demo, we'll just add the profile document.
        const docRef = await addDoc(collection(db, 'users'), staffData);
        return docRef.id;
    } catch (error) {
        console.error("Error adding staff:", error);
        return null;
    }
};

export const deleteStaff = async (uid: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db, 'users', uid));
        return true;
    } catch (error) {
        console.error("Error deleting staff:", error);
        return false;
    }
};

// Branch Management
export const getBranches = async (): Promise<Branch[]> => {
    try {
        const q = query(collection(db, 'branches'), orderBy('name'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
    } catch (error) {
        console.error("Error fetching branches:", error);
        return [];
    }
};

export const saveBranch = async (branch: Omit<Branch, 'id'>, id?: string): Promise<boolean> => {
    try {
        if (id) {
            await updateDoc(doc(db, 'branches', id), branch as any);
        } else {
            await addDoc(collection(db, 'branches'), branch);
        }
        return true;
    } catch (error) {
        console.error("Error saving branch:", error);
        return false;
    }
};

export const deleteBranch = async (id: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db, 'branches', id));
        return true;
    } catch (error) {
        console.error("Error deleting branch:", error);
        return false;
    }
};

// Session Management
export const getSessions = async (branchId?: string): Promise<Session[]> => {
    try {
        let q;
        if (branchId) {
            q = query(collection(db, 'sessions'), where('branchId', '==', branchId));
        } else {
            q = query(collection(db, 'sessions'));
        }
        const snapshot = await getDocs(q);
        const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));

        // Sort in-memory to avoid complex composite index requirements
        return sessions.sort((a, b) => {
            const timeA = a.startTime || 0;
            const timeB = b.startTime || 0;
            if (timeA !== timeB) return timeA - timeB;

            // Secondary sort by creation date
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA - dateB;
        });
    } catch (error) {
        console.error("Error fetching sessions:", error);
        return [];
    }
};

export const saveSession = async (session: Omit<Session, 'id'>, id?: string): Promise<boolean> => {
    try {
        if (id) {
            await updateDoc(doc(db, 'sessions', id), session as any);
        } else {
            const newSession = {
                ...session,
                createdAt: new Date().toISOString()
            };
            await addDoc(collection(db, 'sessions'), newSession);
        }
        return true;
    } catch (error) {
        console.error("Error saving session:", error);
        return false;
    }
};

export const deleteSession = async (id: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db, 'sessions', id));
        return true;
    } catch (error) {
        console.error("Error deleting session:", error);
        return false;
    }
};

// Initialization Logic to seed defaults if DB is empty
export const initializeDefaultData = async (): Promise<boolean> => {
    try {
        const branchesSnapshot = await getDocs(collection(db, 'branches'));
        const sessionsSnapshot = await getDocs(collection(db, 'sessions'));

        if (branchesSnapshot.empty) {
            const defaultBranches = [
                { name: 'Epic Badminton Stadium', address: 'Plot 12, Sports Hub', contactNumber: '9988776655' },
                { name: 'Village Sports Stadium', address: 'Sector 4, Green Valley', contactNumber: '9944556677' }
            ];
            const createdBranches = [];
            for (const b of defaultBranches) {
                const docRef = await addDoc(collection(db, 'branches'), b);
                createdBranches.push({ id: docRef.id, ...b });
            }

            // Seed sessions for these branches
            if (sessionsSnapshot.empty) {
                for (const branch of createdBranches) {
                    const sessions = [
                        { branchId: branch.id, name: 'Morning', timings: '6:00 AM - 10:00 AM', fee: 1500 },
                        { branchId: branch.id, name: 'Evening', timings: '4:00 PM - 8:00 PM', fee: 1500 }
                    ];
                    for (const s of sessions) {
                        await addDoc(collection(db, 'sessions'), s);
                    }
                }
            }
        } else if (sessionsSnapshot.empty) {
            // If branches exist but sessions don't, link to first branch as fallback
            const branches = await getBranches();
            if (branches.length > 0) {
                const defaultSessions = [
                    { branchId: branches[0].id, name: 'Morning', timings: '6:00 AM - 10:00 AM', fee: 1500 },
                    { branchId: branches[0].id, name: 'Evening', timings: '4:00 PM - 8:00 PM', fee: 1500 }
                ];
                for (const s of defaultSessions) {
                    await addDoc(collection(db, 'sessions'), s);
                }
            }
        }
        return true;
    } catch (error) {
        console.error("Error initializing default data:", error);
        return false;
    }
};

import { collection, getDocs, setDoc, doc, query, limit } from 'firebase/firestore';
import { db } from './firebase';

export const initializeDefaultData = async (userId: string): Promise<void> => {
    try {
        // Check if branches already exist
        const branchesRef = collection(db, 'branches');
        const branchesQuery = query(branchesRef, limit(1));
        const branchesSnapshot = await getDocs(branchesQuery);

        if (branchesSnapshot.empty) {
            console.log('No branches found. Creating default branches...');

            // Create default branches
            const defaultBranches = [
                {
                    id: 'epic-badminton',
                    name: 'Epic Badminton',
                    address: '',
                    contactNumber: '',
                },
                {
                    id: 'village',
                    name: 'Village',
                    address: '',
                    contactNumber: '',
                }
            ];

            for (const branch of defaultBranches) {
                await setDoc(doc(db, 'branches', branch.id), branch);
            }
            console.log('Default branches created successfully!');
        }

        // Check if sessions already exist
        const sessionsRef = collection(db, 'sessions');
        const sessionsQuery = query(sessionsRef, limit(1));
        const sessionsSnapshot = await getDocs(sessionsQuery);

        if (sessionsSnapshot.empty) {
            console.log('No sessions found. Creating default sessions...');

            // Create default sessions
            const defaultSessions = [
                {
                    id: 'batch-1',
                    branchId: 'epic-badminton',
                    name: 'Batch 1',
                    timings: '5:00 PM - 6:30 PM',
                    fee: 1000,
                    startTime: 1020, // 5:00 PM in minutes from midnight
                    createdAt: new Date().toISOString(),
                }
            ];

            for (const session of defaultSessions) {
                await setDoc(doc(db, 'sessions', session.id), session);
            }
            console.log('Default sessions created successfully!');
        }

        // Check if academy settings exist
        const settingsRef = doc(db, 'academySettings', userId);
        const settingsQuery = query(collection(db, 'academySettings'), limit(1));
        const settingsSnapshot = await getDocs(settingsQuery);

        if (settingsSnapshot.empty) {
            console.log('No academy settings found. Creating default settings...');
            await setDoc(settingsRef, {
                academyName: 'ABC Badminton Academy',
                branches: [],
                sessions: [],
            });
            console.log('Default academy settings created successfully!');
        }

    } catch (error) {
        console.error('Error initializing default data:', error);
        throw error;
    }
};

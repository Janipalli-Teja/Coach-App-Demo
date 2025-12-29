
import { collection, query, where, getDocs, getDoc, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { Student, SessionType } from '../types';
export const getAllStudents = async (): Promise<Student[]> => {
    try {
        const q = query(collection(db, 'students'), orderBy('fullName'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    } catch (error) {
        console.error("Error fetching all students:", error);
        return [];
    }
};

export const getStudentsByBranch = async (branch: string): Promise<Student[]> => {
    try {
        const q = query(
            collection(db, 'students'),
            where('branch', '==', branch)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    } catch (error) {
        console.error("Error fetching students by branch:", error);
        return [];
    }
};

export const getStudents = async (branch: string, session: string): Promise<Student[]> => {
    try {
        const q = query(
            collection(db, 'students'),
            where('branch', '==', branch),
            where('session', '==', session)
            // Note: orderBy might require a Firestore index. If it fails, remove orderBy until index is created.
            // , orderBy('fullName') 
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    } catch (error) {
        console.error("Error fetching students:", error);
        return [];
    }
};

export const addStudent = async (studentData: Omit<Student, 'id' | 'createdAt'>): Promise<string | null> => {
    try {
        const docRef = await addDoc(collection(db, 'students'), {
            ...studentData,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding student:", error);
        return null;
    }
};
export const updateStudent = async (id: string, studentData: Partial<Student>): Promise<boolean> => {
    try {
        const studentRef = doc(db, 'students', id);
        await updateDoc(studentRef, {
            ...studentData,
            updatedAt: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error("Error updating student:", error);
        return false;
    }
};

export const deleteStudent = async (id: string): Promise<boolean> => {
    try {
        const studentRef = doc(db, 'students', id);
        await deleteDoc(studentRef);
        return true;
    } catch (error) {
        console.error("Error deleting student:", error);
        return false;
    }
};
export const saveAttendance = async (
    updates: { studentId: string; status: 'Present' | 'Absent'; date: string; markedBy: string; markedByName?: string }[]
): Promise<boolean> => {
    try {
        // Process updates sequentially as requested
        for (const update of updates) {
            const studentRef = doc(db, 'students', update.studentId);
            const studentSnap = await getDoc(studentRef);

            if (studentSnap.exists()) {
                const studentData = studentSnap.data();
                const currentHistory: any[] = studentData.attendanceHistory || [];

                const filteredHistory = currentHistory.filter((record: any) => record.date !== update.date);

                const newRecord = {
                    date: update.date,
                    status: update.status,
                    markedBy: update.markedBy,
                    markedByName: update.markedByName
                };

                const updatedHistory = [...filteredHistory, newRecord];

                await updateDoc(studentRef, {
                    attendanceHistory: updatedHistory,
                    lastAttendanceDate: update.date
                });
            }
        }

        return true;
    } catch (error) {
        console.error("Error saving attendance:", error);
        return false;
    }
};

export const saveFeePayments = async (
    updates: { studentId: string; status: 'Paid' | 'Pending'; month: string; year: string; amount?: number; markedBy?: string; markedByName?: string }[]
): Promise<boolean> => {
    try {
        // Process updates sequentially
        for (const update of updates) {
            const studentRef = doc(db, 'students', update.studentId);
            const studentSnap = await getDoc(studentRef);

            if (studentSnap.exists()) {
                const studentData = studentSnap.data();
                const currentHistory: any[] = studentData.feeHistory || [];
                const sessionFee = studentData.sessionFee ?? 0; // Use nullish coalescing to handle null/undefined

                // Remove any existing record for the same month and year
                const filteredHistory = currentHistory.filter((record: any) =>
                    !(record.month === update.month && record.year === update.year)
                );

                // Build the new record - explicitly ensure no undefined values
                const baseRecord = {
                    month: update.month || '',
                    year: update.year || '',
                    amount: (update.amount ?? sessionFee) || 0,
                    status: update.status,
                    markedBy: update.markedBy,
                    markedByName: update.markedByName
                };

                // Only add these fields when status is 'Paid' to avoid Firebase undefined errors
                const newRecord = update.status === 'Paid'
                    ? {
                        ...baseRecord,
                        paidDate: new Date().toISOString(),
                        transactionId: `TXN-${Date.now()}-${update.studentId.slice(0, 4)}`,
                    }
                    : baseRecord;

                const updatedHistory = [...filteredHistory, newRecord];

                await updateDoc(studentRef, {
                    feeHistory: updatedHistory,
                    lastFeeUpdate: `${update.year}-${update.month}`
                });
            }
        }

        return true;
    } catch (error) {
        console.error("Error saving fee payments:", error);
        return false;
    }
};

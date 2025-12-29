
export type UserRole = 'SuperAdmin' | 'Coach' | 'AssistantCoach';

export interface User {
    uid: string;
    email: string;
    role: UserRole;
    name: string;
    phoneNumber?: string;
    academyName?: string; // For SuperAdmin
    branchIds?: string[]; // IDs of branches they have access to
    profileUrl?: string;
}

export type SessionType = string;

export interface AttendanceRecord {
    date: string; // ISO date string YYYY-MM-DD
    status: 'Present' | 'Absent';
    markedBy: string; // User ID of coach
    markedByName?: string; // Name of coach
}

export interface FeeRecord {
    month: string;
    year: string;
    amount: number;
    status: 'Paid' | 'Pending';
    paidDate?: string;
    transactionId?: string;
    markedBy?: string;
    markedByName?: string;
}

export interface Student {
    id: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    aadhaarFrontUrl: string;
    aadhaarBackUrl: string;
    branch: string; // 'Epic Badminton Stadium' | 'Village Sports Stadium'
    session: SessionType;
    sessionTimings: string; // e.g., "6:00 AM - 8:00 AM"
    sessionFee: number;
    attendanceHistory: AttendanceRecord[];
    feeHistory: FeeRecord[];
    createdAt: string;
    joiningDate: string;
}

export interface Branch {
    id: string;
    name: string;
    address: string;
    contactNumber: string;
}

export interface Session {
    id: string;
    branchId: string;
    name: string; // e.g. "Morning", "Evening", "Special Batch"
    timings: string; // e.g. "6:00 AM - 8:00 AM"
    fee: number;
    startTime?: number; // Minutes from midnight for sorting
    createdAt?: string;
}

export interface AcademySettings {
    academyName: string;
    branches: Branch[];
    sessions: Session[];
}

export const DEFAULT_BRANCHES = [
    'Epic Badminton Stadium',
    'Village Sports Stadium',
] as const;

export const DEFAULT_SESSIONS = ['Morning', 'Evening'] as const;

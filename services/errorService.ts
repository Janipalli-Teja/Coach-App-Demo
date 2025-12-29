
export const getFriendlyErrorMessage = (error: any): string => {
    if (!error) return 'An unexpected error occurred. Please try again.';

    const message = error.message || String(error);
    const code = error.code || '';

    // Handle Authentication Errors
    if (code.includes('auth/')) {
        switch (code) {
            case 'auth/email-already-in-use':
                return 'This email address is already registered. Try signing in instead.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/weak-password':
                return 'The password is too weak. Please use at least 6 characters.';
            case 'auth/user-not-found':
                return 'No account found with this email. Please check and try again.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please double-check your credentials.';
            case 'auth/network-request-failed':
                return 'Connection failed. Please check your internet and try again.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later for security.';
            case 'auth/invalid-credential':
                return 'Invalid login credentials. Please try again.';
            default:
                return 'Authentication failed. Please check your details.';
        }
    }

    // Handle Firestore/Network Errors
    if (code.includes('permission-denied')) {
        return 'You do not have permission to perform this action.';
    }
    if (code.includes('unavailable') || message.toLowerCase().includes('network')) {
        return 'Service is temporarily unavailable. Please check your connection.';
    }

    // General user-friendly fallbacks
    if (message.includes('offline')) {
        return 'You appear to be offline. Some actions may not work.';
    }

    // Hide technical jargon (Firebase, API, etc.)
    return 'Something went wrong while processing your request. Please try again.';
};

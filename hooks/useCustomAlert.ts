import { useState, useCallback } from 'react';

interface AlertOptions {
    type?: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    primaryButton?: string;
    secondaryButton?: string;
    onPrimaryPress?: () => void;
    onSecondaryPress?: () => void;
}

export const useCustomAlert = () => {
    const [alertConfig, setAlertConfig] = useState<AlertOptions | null>(null);

    const showAlert = useCallback((options: AlertOptions) => {
        setAlertConfig(options);
    }, []);

    const hideAlert = useCallback(() => {
        setAlertConfig(null);
    }, []);

    return {
        alertConfig,
        showAlert,
        hideAlert,
    };
};

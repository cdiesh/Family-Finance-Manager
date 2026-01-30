import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PrivacyContextType {
    isPrivacyMode: boolean;
    togglePrivacy: (pin?: string) => boolean;
    lock: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const PrivacyProvider = ({ children }: { children: ReactNode }) => {
    // Default to privacy mode ON for safety
    const [isPrivacyMode, setIsPrivacyMode] = useState(true);

    const togglePrivacy = (pin?: string): boolean => {
        if (isPrivacyMode) {
            // Unlocking
            if (pin === '0000') {
                setIsPrivacyMode(false);
                return true;
            }
            return false;
        } else {
            // Locking (no pin needed)
            setIsPrivacyMode(true);
            return true;
        }
    };

    const lock = () => setIsPrivacyMode(true);

    return (
        <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacy, lock }}>
            {children}
        </PrivacyContext.Provider>
    );
};

export const usePrivacy = () => {
    const context = useContext(PrivacyContext);
    if (!context) {
        throw new Error('usePrivacy must be used within a PrivacyProvider');
    }
    return context;
};

import React, { createContext, useContext, ReactNode } from 'react';

interface GamificationContextType {
  showNotification: (points: number, message: string, type?: 'achievement' | 'level' | 'points') => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

interface GamificationProviderProps {
  children: ReactNode;
}

export const GamificationProvider: React.FC<GamificationProviderProps> = ({ children }) => {
  // Simplified implementation that does nothing
  const showNotification = () => {};

  return (
    <GamificationContext.Provider value={{ showNotification }}>
      {children}
    </GamificationContext.Provider>
  );
};
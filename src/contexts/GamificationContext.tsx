import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PointsNotification from '@/components/gamification/PointsNotification';

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

interface Notification {
  id: string;
  points: number;
  message: string;
  type: 'achievement' | 'level' | 'points';
}

interface GamificationProviderProps {
  children: ReactNode;
}

export const GamificationProvider: React.FC<GamificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  // Show notification
  const showNotification = (
    points: number, 
    message: string, 
    type: 'achievement' | 'level' | 'points' = 'points'
  ) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setNotifications(prev => [...prev, { id, points, message, type }]);
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <GamificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Render notifications */}
      {notifications.map((notification, index) => (
        <PointsNotification
          key={notification.id}
          points={notification.points}
          message={notification.message}
          type={notification.type}
          onComplete={() => removeNotification(notification.id)}
        />
      ))}
    </GamificationContext.Provider>
  );
};
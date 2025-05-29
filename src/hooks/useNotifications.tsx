
import { useState, useEffect } from 'react';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const showNotification = async (options: NotificationOptions): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/football.svg',
        badge: options.badge || '/football.svg',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
      });

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  };

  const scheduleTradeDeadlineNotification = (deadlineDate: Date, leagueName: string) => {
    if (!isSupported || permission !== 'granted') return;

    const now = new Date();
    const timeUntilDeadline = deadlineDate.getTime() - now.getTime();
    
    // Schedule notification 1 hour before deadline
    const oneHourBefore = timeUntilDeadline - (60 * 60 * 1000);
    
    if (oneHourBefore > 0) {
      setTimeout(() => {
        showNotification({
          title: 'Trade Deadline Approaching',
          body: `${leagueName} trade deadline in 1 hour!`,
          tag: 'trade-deadline',
          requireInteraction: true,
        });
      }, oneHourBefore);
    }
  };

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    scheduleTradeDeadlineNotification,
    canNotify: permission === 'granted' && isSupported,
  };
};

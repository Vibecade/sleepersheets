import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  id?: string;
  user_id: string;
  trade_deadline_notifications: boolean;
  waiver_notifications: boolean;
  league_activity_notifications: boolean;
  push_notifications_enabled: boolean;
}

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: any;
}

export const useEnhancedNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
    
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      let { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No preferences found, create default ones
        const defaultPrefs = {
          user_id: user.id,
          trade_deadline_notifications: true,
          waiver_notifications: true,
          league_activity_notifications: true,
          push_notifications_enabled: true
        };

        const { data: newData, error: insertError } = await supabase
          .from('notification_preferences')
          .insert(defaultPrefs)
          .select()
          .single();

        if (insertError) throw insertError;
        data = newData;
      } else if (error) {
        throw error;
      }

      setPreferences(data);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user || !preferences) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setPreferences(data);
      
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences.",
        variant: "destructive"
      });
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted' && preferences) {
        await updatePreferences({ push_notifications_enabled: true });
      }
      
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const showNotification = async (options: NotificationOptions): Promise<boolean> => {
    if (!isSupported || permission !== 'granted' || !preferences?.push_notifications_enabled) {
      return false;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/football.svg',
        badge: options.badge || '/football.svg',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        data: options.data
      });

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      // Handle notification clicks
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
        
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  };

  const scheduleTradeDeadlineNotification = (deadlineDate: Date, leagueName: string) => {
    if (!preferences?.trade_deadline_notifications) return;

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
          data: { type: 'trade_deadline', leagueName }
        });
      }, oneHourBefore);
    }
  };

  const notifyWaiverActivity = (leagueName: string, activity: string) => {
    if (!preferences?.waiver_notifications) return;

    showNotification({
      title: 'Waiver Activity',
      body: `${activity} in ${leagueName}`,
      tag: 'waiver-activity',
      data: { type: 'waiver', leagueName }
    });
  };

  const notifyLeagueActivity = (leagueName: string, activity: string, type: string) => {
    if (!preferences?.league_activity_notifications) return;

    const titles = {
      trade: 'New Trade',
      comment: 'New Comment',
      announcement: 'League Announcement',
      contract_update: 'Contract Update'
    };

    showNotification({
      title: titles[type as keyof typeof titles] || 'League Activity',
      body: `${activity} in ${leagueName}`,
      tag: `${type}-activity`,
      data: { type, leagueName }
    });
  };

  const setupRealtimeNotifications = (leagueId: string, leagueName: string) => {
    if (!user || !preferences) return;

    // Subscribe to league activities
    const channel = supabase
      .channel(`notifications-${leagueId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'league_activities',
          filter: `league_id=eq.${leagueId}`
        },
        (payload) => {
          const activity = payload.new;
          
          // Don't notify for own actions
          if (activity.user_id === user.id) return;
          
          notifyLeagueActivity(
            leagueName, 
            activity.description || activity.title,
            activity.activity_type
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'league_comments',
          filter: `league_id=eq.${leagueId}`
        },
        (payload) => {
          const comment = payload.new;
          
          // Don't notify for own comments
          if (comment.user_id === user.id) return;
          
          notifyLeagueActivity(
            leagueName,
            'New comment posted',
            'comment'
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    isSupported,
    permission,
    preferences,
    loading,
    requestPermission,
    updatePreferences,
    showNotification,
    scheduleTradeDeadlineNotification,
    notifyWaiverActivity,
    notifyLeagueActivity,
    setupRealtimeNotifications,
    canNotify: permission === 'granted' && isSupported && preferences?.push_notifications_enabled
  };
};
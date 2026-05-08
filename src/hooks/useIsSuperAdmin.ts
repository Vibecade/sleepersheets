import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

const cache = new Map<string, boolean>();

export const useIsSuperAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const email = user?.email ?? null;
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() =>
    email ? cache.get(email) ?? false : false
  );
  const [isLoading, setIsLoading] = useState<boolean>(authLoading || (!!email && !cache.has(email)));

  useEffect(() => {
    let cancelled = false;

    if (authLoading) {
      setIsLoading(true);
      return () => {
        cancelled = true;
      };
    }

    if (!email) {
      setIsSuperAdmin(false);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (cache.has(email)) {
      setIsSuperAdmin(cache.get(email)!);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('super_admins')
          .select('email')
          .eq('email', email)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          logger.error('Error checking super admin status:', error);
          cache.set(email, false);
          setIsSuperAdmin(false);
        } else {
          const result = !!data;
          cache.set(email, result);
          setIsSuperAdmin(result);
        }
      } catch (err) {
        if (!cancelled) {
          logger.error('Error checking super admin status:', err);
          setIsSuperAdmin(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [email, authLoading]);

  return { isSuperAdmin, isLoading, email };
};

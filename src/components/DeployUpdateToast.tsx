import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { usePWA } from '@/hooks/usePWA';

const LAST_SEEN_VERSION_KEY = 'sleepersheets:last-seen-version';
const LAST_WHATS_NEW_KEY = 'sleepersheets:last-whats-new-toast';
const APP_VERSION = __APP_VERSION__;

const DeployUpdateToast = () => {
  const { toast } = useToast();
  const { updateAvailable, updateApp } = usePWA();
  const hasShownReleaseToast = useRef(false);
  const hasShownUpdateToast = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || hasShownReleaseToast.current) {
      return;
    }
    if (!import.meta.env.PROD || APP_VERSION === 'dev') {
      return;
    }

    try {
      const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY);
      if (lastSeenVersion === APP_VERSION) {
        return;
      }

      hasShownReleaseToast.current = true;
      localStorage.setItem(LAST_SEEN_VERSION_KEY, APP_VERSION);

      // Avoid replaying the "what changed" toast repeatedly during the same deploy.
      const lastToastVersion = localStorage.getItem(LAST_WHATS_NEW_KEY);
      if (lastToastVersion === APP_VERSION) {
        return;
      }
      localStorage.setItem(LAST_WHATS_NEW_KEY, APP_VERSION);
    } catch {
      hasShownReleaseToast.current = true;
    }

    toast({
      title: 'SleeperSheets updated',
      description: 'What changed: streamlined empty states, lighter loading skeletons, and smoother motion. If anything looks stale, refresh once.',
      action: (
        <ToastAction altText="Reload app" onClick={() => window.location.reload()}>
          Refresh
        </ToastAction>
      ),
    });
  }, [toast]);

  useEffect(() => {
    if (!updateAvailable || hasShownUpdateToast.current) {
      return;
    }

    hasShownUpdateToast.current = true;
    toast({
      title: 'New version ready',
      description: 'A cached update is available now. Reload to ensure all pages and chunks are in sync.',
      action: (
        <ToastAction altText="Apply update" onClick={() => void updateApp()}>
          Reload
        </ToastAction>
      ),
    });
  }, [toast, updateAvailable, updateApp]);

  return null;
};

export default DeployUpdateToast;


import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;
let swMessageListenerAttached = false;

const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        logger.debug('Service Worker registered:', reg);
        return reg;
      })
      .catch((error) => {
        logger.error('Service Worker registration failed:', error);
        return null;
      });
  }

  if (!swMessageListenerAttached) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'BACKGROUND_SYNC') {
        logger.debug('Background sync triggered');
        window.dispatchEvent(new CustomEvent('backgroundsync'));
      }
    });
    swMessageListenerAttached = true;
  }

  return swRegistrationPromise;
};

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Register service worker with update detection
    let isMounted = true;
    let updateFoundListener: (() => void) | null = null;
    let registeredServiceWorker: ServiceWorkerRegistration | null = null;
    if ('serviceWorker' in navigator) {
      registerServiceWorker().then((reg) => {
        if (!reg || !isMounted) return;
        registeredServiceWorker = reg;
        setRegistration(reg);

        // Check for updates
        updateFoundListener = () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        };
        reg.addEventListener('updatefound', updateFoundListener);
      });
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Handle app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if app is already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      isMounted = false;
      if (registeredServiceWorker && updateFoundListener) {
        registeredServiceWorker.removeEventListener('updatefound', updateFoundListener);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error installing app:', error);
      return false;
    }
  };

  const updateApp = async () => {
    if (!registration || !updateAvailable) return false;
    
    try {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error updating app:', error);
      return false;
    }
  };

  const requestBackgroundSync = async (tag: string) => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const reg = await navigator.serviceWorker.ready;
        // @ts-expect-error - Background Sync is still missing in the DOM lib typing.
        await reg.sync.register(tag);
        logger.debug('Background sync registered for tag:', tag);
        return true;
      } catch (error) {
        logger.error('Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  };

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    isInstalled,
    isOnline,
    updateAvailable,
    registration,
    installApp,
    updateApp,
    requestBackgroundSync
  };
};

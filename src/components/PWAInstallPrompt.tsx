
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const PWA_DISMISSED_KEY = 'pwa_install_prompt_dismissed';

const PWAInstallPrompt: React.FC = () => {
  const { canInstall, installApp, isOnline } = usePWA();
  const [dismissed, setDismissed] = useState(() => {
    try {
      const stored = localStorage.getItem(PWA_DISMISSED_KEY);
      return stored === 'true';
    } catch (error) {
      console.error('Error reading PWA dismissal state:', error);
      return false;
    }
  });

  const handleDismiss = () => {
    try {
      localStorage.setItem(PWA_DISMISSED_KEY, 'true');
      setDismissed(true);
    } catch (error) {
      console.error('Error saving PWA dismissal state:', error);
      setDismissed(true);
    }
  };

  if (!canInstall || dismissed || !isOnline) {
    return null;
  }

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      handleDismiss();
    }
  };

  return (
    <Card className="border-emerald-200 bg-emerald-50 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-emerald-800 text-base">Install SleeperSheets</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-emerald-600 hover:text-emerald-700 h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription className="text-emerald-700">
          Get the full app experience with offline access and faster loading.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex space-x-2">
          <Button
            onClick={handleInstall}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Install App
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
          >
            Maybe Later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWAInstallPrompt;

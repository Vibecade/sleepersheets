import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, DollarSign, RefreshCw, Users, X } from 'lucide-react';

const WhatsNewModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen this version of "What's New"
    const hasSeenWhatsNew = localStorage.getItem('whats-new-v1.0');
    if (!hasSeenWhatsNew) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('whats-new-v1.0', 'true');
  };

  const updates = [
    {
      icon: <DollarSign className="w-5 h-5 text-green-500" />,
      title: "Updated FAAB Logic",
      description: "Track live FAAB transactions and calculate remaining and spent FAAB accurately. Failed bids no longer count against your budget."
    },
    {
      icon: <RefreshCw className="w-5 h-5 text-blue-500" />,
      title: "Bulk Re-sync Feature", 
      description: "Added bulk re-sync to help refresh data if you feel it's outdated. Rate limited to prevent API abuse - you may see warnings if used too frequently."
    },
    {
      icon: <Users className="w-5 h-5 text-purple-500" />,
      title: "Account & League Linking",
      description: "Link your Sleeper account to your Google account to automatically track all leagues you participate in, not just ones you own."
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <DialogTitle>What's New</DialogTitle>
              <Badge variant="secondary" className="text-xs">v1.0</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {updates.map((update, index) => (
            <div key={index} className="flex space-x-3">
              <div className="flex-shrink-0 mt-1">
                {update.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm text-white mb-1">
                  {update.title}
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {update.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-700">
          <Button onClick={handleClose} size="sm">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsNewModal;
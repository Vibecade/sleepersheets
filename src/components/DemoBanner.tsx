import React from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, X } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { isDemoMode, exitDemo } = useDemo();

  if (!isDemoMode) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-200/20 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 border-blue-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Demo Mode
          </Badge>
          <span className="text-sm text-muted-foreground">
            You're viewing sample data. Connect your league to see real data.
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={exitDemo}
          className="bg-background/50 hover:bg-background/80"
        >
          <X className="h-4 w-4 mr-1" />
          Exit Demo
        </Button>
      </div>
    </div>
  );
};
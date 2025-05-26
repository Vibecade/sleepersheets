
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Minimize2, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

const ScrollableModal: React.FC<ScrollableModalProps> = ({
  open,
  onOpenChange,
  title,
  children,
  className,
  maxHeight = "80vh"
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "max-w-4xl w-full glass-card border border-white/20",
          isMinimized ? "h-16" : `max-h-[${maxHeight}]`,
          "flex flex-col overflow-hidden",
          className
        )}
      >
        <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle className="text-lg font-semibold text-white">
            {title}
          </DialogTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0 text-white hover:text-gray-300"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 text-white hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {!isMinimized && (
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="pr-2">
              {children}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScrollableModal;

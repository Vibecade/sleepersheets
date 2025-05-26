
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

  console.log('ScrollableModal render - isMinimized:', isMinimized, 'open:', open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "max-w-4xl w-full glass-card border border-white/20",
          "flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
          isMinimized ? "h-16 min-h-[4rem]" : "max-h-[85vh] min-h-[20rem]",
          className
        )}
        style={isMinimized ? { height: '4rem', minHeight: '4rem' } : { maxHeight: maxHeight, minHeight: '20rem' }}
        hideCloseButton={true}
      >
        <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between space-y-0 pb-2 border-b border-white/10">
          <DialogTitle className="text-lg font-semibold text-white">
            {title}
          </DialogTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                console.log('Minimize button clicked, current state:', isMinimized);
                setIsMinimized(!isMinimized);
              }}
              className="h-8 w-8 p-0 text-white hover:text-gray-300 hover:bg-white/10 transition-colors"
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onOpenChange(false);
              }}
              className="h-8 w-8 p-0 text-white hover:text-gray-300 hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {!isMinimized && (
          <div 
            className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
            style={{ maxHeight: `calc(${maxHeight} - 5rem)` }}
          >
            <div className="p-4">
              {children}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScrollableModal;

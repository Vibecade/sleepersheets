import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  Home, 
  Users, 
  BarChart3, 
  FileText, 
  Calculator,
  MessageCircle,
  Settings,
  ChevronRight,
  Zap,
  TrendingUp,
  Activity
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  badge?: string;
  color?: string;
}

interface EnhancedMobileNavProps {
  leagueId?: string;
  children?: React.ReactNode;
  className?: string;
}

export function EnhancedMobileNav({ leagueId, children, className }: EnhancedMobileNavProps) {
  const [open, setOpen] = useState(false);
  const [gestureStart, setGestureStart] = useState<{ x: number; y: number } | null>(null);
  const [isSwipeGesture, setIsSwipeGesture] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Navigation items
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/overview', label: 'Team Overview', icon: Users },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/export', label: 'Export', icon: FileText },
  ];

  // Quick actions for league-specific features
  const quickActions: QuickAction[] = leagueId ? [
    {
      id: 'faab-manager',
      label: 'FAAB Manager',
      icon: Calculator,
      action: () => {
        // Scroll to FAAB section or open modal
        const element = document.querySelector('[data-component="faab-manager"]');
        element?.scrollIntoView({ behavior: 'smooth' });
        setOpen(false);
      },
      color: 'text-green-600'
    },
    {
      id: 'trade-simulator',
      label: 'Trade Simulator',
      icon: TrendingUp,
      action: () => {
        const element = document.querySelector('[data-component="trade-simulator"]');
        element?.scrollIntoView({ behavior: 'smooth' });
        setOpen(false);
      },
      color: 'text-blue-600'
    },
    {
      id: 'league-chat',
      label: 'League Chat',
      icon: MessageCircle,
      action: () => {
        const element = document.querySelector('[data-component="league-chat"]');
        element?.scrollIntoView({ behavior: 'smooth' });
        setOpen(false);
      },
      badge: 'New',
      color: 'text-purple-600'
    },
    {
      id: 'contract-calculator',
      label: 'Contract Calculator',
      icon: Zap,
      action: () => {
        const element = document.querySelector('[data-component="contract-calculator"]');
        element?.scrollIntoView({ behavior: 'smooth' });
        setOpen(false);
      },
      color: 'text-orange-600'
    }
  ] : [];

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setGestureStart({ x: touch.clientX, y: touch.clientY });
    setIsSwipeGesture(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!gestureStart) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - gestureStart.x;
    const deltaY = Math.abs(touch.clientY - gestureStart.y);
    
    // Detect horizontal swipe (more horizontal than vertical movement)
    if (Math.abs(deltaX) > 30 && deltaY < 50) {
      setIsSwipeGesture(true);
      
      // Right swipe from left edge opens nav
      if (deltaX > 0 && gestureStart.x < 50 && !open) {
        setOpen(true);
      }
      // Left swipe closes nav
      else if (deltaX < -50 && open) {
        setOpen(false);
      }
    }
  };

  const handleTouchEnd = () => {
    setGestureStart(null);
    setIsSwipeGesture(false);
  };

  // Add global touch listeners for edge swipe gesture
  useEffect(() => {
    if (!isMobile) return;

    const handleGlobalTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      // Only handle swipes from the left edge
      if (touch.clientX < 20) {
        setGestureStart({ x: touch.clientX, y: touch.clientY });
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!gestureStart || open) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - gestureStart.x;
      
      // Right swipe from left edge
      if (deltaX > 50 && gestureStart.x < 20) {
        setOpen(true);
        setGestureStart(null);
      }
    };

    document.addEventListener('touchstart', handleGlobalTouchStart, { passive: true });
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleGlobalTouchStart);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
    };
  }, [gestureStart, open, isMobile]);

  if (!isMobile) {
    return children || null;
  }

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-10 w-10 p-0 md:hidden fixed top-4 left-4 z-50",
            "touch-manipulation bg-background/80 backdrop-blur-sm",
            "border border-border/50 hover:bg-accent",
            className
          )}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="left" 
        className="w-80 p-0 overflow-hidden"
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Navigation</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Swipe from left edge to open
            </p>
          </div>

          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={action.action}
                    className="h-auto p-3 flex flex-col items-center space-y-1 touch-manipulation"
                  >
                    <action.icon className={cn("h-4 w-4", action.color)} />
                    <span className="text-xs text-center leading-tight">
                      {action.label}
                    </span>
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {action.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Pages
            </h3>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isActivePath(item.path) ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "w-full justify-start h-12 px-4 touch-manipulation",
                    isActivePath(item.path) && "bg-accent text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span className="text-base">{item.label}</span>
                  <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                </Button>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigate('/settings');
                setOpen(false);
              }}
              className="w-full justify-start h-10 touch-manipulation"
            >
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
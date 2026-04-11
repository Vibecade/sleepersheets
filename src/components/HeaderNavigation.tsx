
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNav } from '@/components/ui/mobile-nav';
import { Home, Info, FileText, Download, Trophy } from 'lucide-react';

const HeaderNavigation = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  const navigationItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/about', label: 'About', icon: Info },
    { path: '/how-to', label: 'How to Use', icon: FileText },
    { path: '/export', label: 'Export & AI', icon: Download },
  ];

  if (isMobile) {
    return (
      <div className="sticky top-0 z-40 border-b border-white/10 bg-background/85 backdrop-blur-md">
        <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-3 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide">
            <Trophy className="w-4 h-4 text-primary" />
            SleeperSheets
          </Link>

          <MobileNav>
            {navigationItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? 'default' : 'ghost'}
                  className="flex items-center justify-start space-x-3 w-full h-12 text-left"
                  size="lg"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-base">{item.label}</span>
                </Button>
              </Link>
            ))}
          </MobileNav>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-background/85 backdrop-blur-md">
      <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm lg:text-base font-semibold tracking-wide">
          <Trophy className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
          SleeperSheets
        </Link>

        <nav className="flex items-center space-x-1 lg:space-x-2 rounded-2xl border border-border/70 bg-card/60 p-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${navigationMenuTriggerStyle()} lg:px-4 lg:py-2.5 lg:text-base rounded-xl transition-[background-color,color,border-color,box-shadow] duration-150 ${location.pathname === item.path ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-accent/40 hover:text-foreground'}`}
            >
              <item.icon className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default HeaderNavigation;

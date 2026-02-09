
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNav } from '@/components/ui/mobile-nav';
import { Home, Info, FileText, Download } from 'lucide-react';

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
      <div className="absolute top-4 left-4">
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
    );
  }

  return (
    <div className="absolute top-4 left-4 lg:top-6 lg:left-6">
      <nav className="flex items-center space-x-1 lg:space-x-2">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`${navigationMenuTriggerStyle()} hover-border-glow transition-all duration-200 lg:px-4 lg:py-2.5 lg:text-base hover:-translate-y-0.5 hover:shadow-lg`}
          >
            <item.icon className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default HeaderNavigation;

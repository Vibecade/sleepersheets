
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Settings, Trophy, Download, BarChart3, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNav } from '@/components/ui/mobile-nav';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';
import { cn } from '@/lib/utils';

interface PageNavigationProps {
  currentPage: 'overview' | 'manager' | 'commissioner';
  onPageChange: (page: 'overview' | 'manager' | 'commissioner') => void;
  leagueData?: any;
}

const PageNavigation: React.FC<PageNavigationProps> = ({
  currentPage,
  onPageChange,
  leagueData
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { canModifyLeague } = useLeagueOwnership();
  
  // Check if user is league owner (can see commissioner tools)
  const isLeagueOwner = leagueData?.league_id ? canModifyLeague(leagueData.league_id) : false;

  const handleExportClick = () => {
    if (leagueData) {
      navigate('/export', { state: { leagueData } });
    } else {
      navigate('/export');
    }
  };

  const baseNavigationItems = [
    {
      id: 'overview' as const,
      label: 'League Overview',
      shortLabel: 'Overview',
      icon: Trophy,
      onClick: () => onPageChange('overview'),
    },
    {
      id: 'manager' as const,
      label: 'Fantasy Manager',
      shortLabel: 'Manager',
      icon: Settings,
      onClick: () => onPageChange('manager'),
    },
  ];

  // Add Commissioner tab only for league owners
  const commissionerItem = isLeagueOwner ? {
    id: 'commissioner' as const,
    label: 'Commissioner',
    shortLabel: 'Commissioner',
    icon: Shield,
    onClick: () => onPageChange('commissioner'),
  } : null;

  const exportItem = {
    id: 'export' as const,
    label: 'Export & AI',
    shortLabel: 'Export',
    icon: Download,
    onClick: handleExportClick,
  };

  const navigationItems = [
    ...baseNavigationItems,
    ...(commissionerItem ? [commissionerItem] : []),
    exportItem
  ];

  if (isMobile) {
    return (
      <div className="glass-card rounded-xl p-3 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {navigationItems.find(item => item.id === currentPage)?.label || 'Navigation'}
          </h2>
          <MobileNav>
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'default' : 'ghost'}
                onClick={item.onClick}
                className="flex items-center justify-start space-x-3 w-full h-12 text-left"
                size="lg"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-base">{item.label}</span>
              </Button>
            ))}
          </MobileNav>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-1.5 lg:p-2 mb-8 shadow-lg border border-border/50">
      <div className="flex items-center gap-1 lg:gap-2">
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            variant={currentPage === item.id ? 'default' : 'ghost'}
            onClick={item.onClick}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 h-11 lg:h-12 transition-all duration-200",
              "hover:shadow-md hover:-translate-y-0.5",
              currentPage === item.id && "shadow-lg"
            )}
            size="default"
          >
            <item.icon className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
            <span className="hidden sm:inline text-sm lg:text-base font-semibold">{item.label}</span>
            <span className="sm:hidden text-xs font-semibold">{item.shortLabel}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PageNavigation;

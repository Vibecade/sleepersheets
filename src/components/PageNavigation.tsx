
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Trophy, Download, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNav } from '@/components/ui/mobile-nav';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
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
  const { isSuperAdmin } = useIsSuperAdmin();

  // Check if user is league owner (can see commissioner tools)
  const isLeagueOwner = leagueData?.league_id ? canModifyLeague(leagueData.league_id) : false;
  const canSeeCommissioner = isLeagueOwner || isSuperAdmin;

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

  // Add Commissioner tab for league owners and super admins
  const commissionerItem = canSeeCommissioner ? {
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
      <div className="glass-card rounded-xl p-2.5 mb-3">
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
    <div className="glass-card rounded-xl p-1 lg:p-1.5 mb-4 shadow-lg border border-border/50">
      <div className="flex items-center gap-1 lg:gap-3">
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            variant={currentPage === item.id ? 'default' : 'ghost'}
            onClick={item.onClick}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 lg:gap-2.5 h-10 lg:h-11 transition-all duration-200",
              "hover:shadow-md hover-border-glow",
              currentPage === item.id && "shadow-lg ring-2 ring-primary/30"
            )}
            size="default"
          >
            <item.icon className="w-4 h-4 lg:w-4 lg:h-4 xl:w-5 xl:h-5 flex-shrink-0" />
            <span className="hidden sm:inline text-sm lg:text-sm xl:text-base font-semibold">{item.label}</span>
            <span className="sm:hidden text-xs font-semibold">{item.shortLabel}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PageNavigation;


import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Settings, Trophy, Download, BarChart3, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNav } from '@/components/ui/mobile-nav';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';

interface PageNavigationProps {
  currentPage: 'overview' | 'manager' | 'analytics' | 'commissioner';
  onPageChange: (page: 'overview' | 'manager' | 'analytics' | 'commissioner') => void;
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
      id: 'analytics' as const,
      label: 'Analytics Dashboard',
      shortLabel: 'Analytics',
      icon: BarChart3,
      onClick: () => onPageChange('analytics'),
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
    <div className="glass-card rounded-xl p-2 mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            variant={currentPage === item.id ? 'default' : 'ghost'}
            onClick={item.onClick}
            className="flex items-center justify-center gap-1 sm:gap-2 h-10 mobile-btn-compact min-w-0"
            size="default"
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate block sm:hidden">{item.shortLabel}</span>
            <span className="truncate hidden sm:block">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PageNavigation;

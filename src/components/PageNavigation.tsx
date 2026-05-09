import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Trophy, Download, Shield, Sparkles, Menu, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNav } from '@/components/ui/mobile-nav';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import UserMenu from '@/components/UserMenu';
import { cn } from '@/lib/utils';

interface PageNavigationProps {
  currentPage: 'gamification' | 'overview' | 'manager' | 'commissioner';
  onPageChange: (page: 'gamification' | 'overview' | 'manager' | 'commissioner') => void;
  leagueData?: any;
}

const PageNavigation: React.FC<PageNavigationProps> = ({
  currentPage,
  onPageChange,
  leagueData,
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { canModifyLeague } = useLeagueOwnership();
  const { isSuperAdmin } = useIsSuperAdmin();

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
      id: 'gamification' as const,
      label: 'League Pulse',
      shortLabel: 'Pulse',
      icon: Sparkles,
      onClick: () => onPageChange('gamification'),
    },
    {
      id: 'overview' as const,
      label: 'Overview',
      shortLabel: 'Overview',
      icon: Trophy,
      onClick: () => onPageChange('overview'),
    },
    {
      id: 'manager' as const,
      label: 'Manager Tools',
      shortLabel: 'Manager',
      icon: Settings,
      onClick: () => onPageChange('manager'),
    },
  ];

  // Visible to league owners and super admins
  const commissionerItem = canSeeCommissioner
    ? {
        id: 'commissioner' as const,
        label: 'Commissioner',
        shortLabel: 'Commissioner',
        icon: Shield,
        onClick: () => onPageChange('commissioner'),
      }
    : null;

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
    exportItem,
  ];

  if (isMobile) {
    return (
      <div className="bg-card border border-border px-3 py-2.5 mb-3 flex items-center justify-between gap-3">
        <h2
          className="font-headline font-bold uppercase text-primary"
          style={{ fontSize: 13, letterSpacing: '0.15em' }}
        >
          {navigationItems.find((item) => item.id === currentPage)?.label || 'Navigation'}
        </h2>
        <MobileNav
          trigger={
            <Button variant="ghost" size="sm" className="h-9 px-3 gap-1 font-mono text-[11px]">
              <Menu className="h-4 w-4" />
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          }
        >
          {navigationItems.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={cn(
                  'flex items-center gap-3 w-full text-left px-4 py-3 font-headline font-bold uppercase border-l-2 transition-colors',
                  active
                    ? 'text-primary border-primary bg-primary/5'
                    : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border',
                )}
                style={{ fontSize: 14, letterSpacing: '0.125em' }}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </MobileNav>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 mb-4 flex-wrap">
      {navigationItems.map((item) => {
        const active = currentPage === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className={cn(
              'inline-flex items-center gap-2 px-5 lg:px-6 h-11 font-headline font-bold uppercase border transition-colors cursor-pointer',
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-primary/40',
            )}
            style={{
              fontSize: 13,
              letterSpacing: '0.15em',
              clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
            }}
          >
            <item.icon className="w-4 h-4" />
            <span className="hidden lg:inline">{item.label}</span>
            <span className="lg:hidden">{item.shortLabel}</span>
          </button>
        );
      })}
      <span className="flex-1" />
      <span
        className="hidden lg:inline-flex items-center px-4 font-mono text-muted-foreground"
        style={{ fontSize: 10, letterSpacing: '0.15em' }}
      >
        WEEK {leagueData?.league?.settings?.leg ?? leagueData?.league?.settings?.week ?? '—'} ↓
      </span>
      {/* Once a user has loaded a league there was no header at all and
          therefore nowhere to sign out. UserMenu returns null when the
          user is anonymous, so this is a no-op for guest viewers. */}
      <UserMenu />
    </div>
  );
};

export default PageNavigation;

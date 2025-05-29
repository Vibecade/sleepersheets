
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Settings, Trophy, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface PageNavigationProps {
  currentPage: 'overview' | 'manager';
  onPageChange: (page: 'overview' | 'manager') => void;
  leagueData?: any;
}

const PageNavigation: React.FC<PageNavigationProps> = ({
  currentPage,
  onPageChange,
  leagueData
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleExportClick = () => {
    if (leagueData) {
      navigate('/export', { state: { leagueData } });
    } else {
      navigate('/export');
    }
  };

  return (
    <div className="glass-card rounded-xl p-2 mb-6">
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <Button
          variant={currentPage === 'overview' ? 'default' : 'ghost'}
          onClick={() => onPageChange('overview')}
          className="flex items-center justify-center space-x-2 flex-1 h-10"
          size={isMobile ? "sm" : "default"}
        >
          <Trophy className="w-4 h-4" />
          <span className={isMobile ? "text-sm" : ""}>League Overview</span>
        </Button>
        <Button
          variant={currentPage === 'manager' ? 'default' : 'ghost'}
          onClick={() => onPageChange('manager')}
          className="flex items-center justify-center space-x-2 flex-1 h-10"
          size={isMobile ? "sm" : "default"}
        >
          <Settings className="w-4 h-4" />
          <span className={isMobile ? "text-sm" : ""}>Fantasy Manager</span>
        </Button>
        <Button
          variant="ghost"
          onClick={handleExportClick}
          className="flex items-center justify-center space-x-2 flex-1 h-10"
          size={isMobile ? "sm" : "default"}
        >
          <Download className="w-4 h-4" />
          <span className={isMobile ? "text-sm" : ""}>Export & AI</span>
        </Button>
      </div>
    </div>
  );
};

export default PageNavigation;

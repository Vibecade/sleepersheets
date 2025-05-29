
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Settings, Trophy, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageNavigationProps {
  currentPage: 'overview' | 'manager';
  onPageChange: (page: 'overview' | 'manager') => void;
}

const PageNavigation: React.FC<PageNavigationProps> = ({
  currentPage,
  onPageChange
}) => {
  const navigate = useNavigate();

  return (
    <div className="glass-card rounded-xl p-2 mb-6">
      <div className="flex space-x-2">
        <Button
          variant={currentPage === 'overview' ? 'default' : 'ghost'}
          onClick={() => onPageChange('overview')}
          className="flex items-center space-x-2 flex-1"
        >
          <Trophy className="w-4 h-4" />
          <span>League Overview</span>
        </Button>
        <Button
          variant={currentPage === 'manager' ? 'default' : 'ghost'}
          onClick={() => onPageChange('manager')}
          className="flex items-center space-x-2 flex-1"
        >
          <Settings className="w-4 h-4" />
          <span>Fantasy Manager</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate('/export')}
          className="flex items-center space-x-2 flex-1"
        >
          <Download className="w-4 h-4" />
          <span>Export & AI</span>
        </Button>
      </div>
    </div>
  );
};

export default PageNavigation;


import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, LucideIcon } from 'lucide-react';

interface ExportButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  colorClass: string;
  hoverColorClass: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  onClick,
  disabled = false,
  icon: Icon,
  title,
  description,
  colorClass,
  hoverColorClass
}) => {
  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="space-y-3 text-center">
        <Icon className={`w-8 h-8 ${colorClass} mx-auto mb-2`} />
        <h4 className="font-medium text-white">{title}</h4>
        <p className="text-sm text-gray-300 mb-3 min-h-[2.5rem] flex items-center justify-center">{description}</p>
        <Button 
          onClick={onClick} 
          disabled={disabled}
          className={`w-full ${colorClass.replace('text-', 'bg-')} ${hoverColorClass}`}
        >
          <Download className="w-4 h-4 mr-2" />
          {title}
        </Button>
      </div>
    </div>
  );
};

export default ExportButton;

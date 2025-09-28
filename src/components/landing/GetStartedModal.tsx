import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Link2, 
  Search, 
  LogIn, 
  Play,
  ArrowRight,
  Users,
  Trophy,
  Target
} from 'lucide-react';

interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: 'connect' | 'auth' | 'demo') => void;
}

const GetStartedModal: React.FC<GetStartedModalProps> = ({
  isOpen,
  onClose,
  onSelectOption
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const options = [
    {
      id: 'connect',
      icon: Link2,
      title: 'Connect Your League',
      description: 'Enter your League ID or Username to get started instantly',
      color: 'border-primary/20 hover:border-primary/40',
      badge: 'Smart Detection'
    },
    {
      id: 'auth',
      icon: LogIn,
      title: 'Sign in to manage leagues', 
      description: 'Create an account to save and manage multiple leagues',
      color: 'border-success/20 hover:border-success/40',
      badge: 'Full Features'
    },
    {
      id: 'demo',
      icon: Play,
      title: 'Try a demo league',
      description: 'Explore features with a sample dynasty league',
      color: 'border-chart-3/20 hover:border-chart-3/40',
      badge: 'No Setup'
    }
  ];

  const handleSelectOption = (optionId: string) => {
    onSelectOption(optionId as 'connect' | 'auth' | 'demo');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            Choose Your <span className="gradient-text">Path to Victory</span>
          </DialogTitle>
          <p className="text-muted-foreground text-center">
            Select how you'd like to get started with SleeperSheets
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {options.map((option) => (
            <Card 
              key={option.id}
              className={`glass-card hover-lift cursor-pointer transition-all duration-300 ${option.color} ${
                selectedOption === option.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedOption(option.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-lg bg-background/50">
                    <option.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                    {option.badge}
                  </span>
                </div>
                <CardTitle className="text-lg">{option.title}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectOption(option.id);
                  }}
                  className="w-full"
                  variant={selectedOption === option.id ? "default" : "outline"}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default GetStartedModal;
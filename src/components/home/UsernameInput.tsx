
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';

interface UsernameInputProps {
  username: string;
  setUsername: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export const UsernameInput = ({ username, setUsername, onSubmit, loading }: UsernameInputProps) => {
  return (
    <div className="group">
      <Label htmlFor="username" className="text-white text-sm font-semibold mb-3 block">
        Sleeper Username (Auto-Discovery)
      </Label>
      <div className="flex space-x-3">
        <Input
          id="username"
          placeholder="e.g., your_username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex-1 h-12 text-lg group-hover:border-blue-400/50 transition-all duration-300"
        />
        <Button 
          onClick={onSubmit} 
          disabled={loading}
          variant="outline"
          size="lg"
          className="px-6"
        >
          {loading ? (
            <div className="shimmer w-4 h-4 rounded"></div>
          ) : (
            <ArrowRight className="w-5 h-5" />
          )}
        </Button>
      </div>
      <p className="text-xs text-gray-400 mt-2 italic">
        We'll automatically find and load your most recent league
      </p>
    </div>
  );
};

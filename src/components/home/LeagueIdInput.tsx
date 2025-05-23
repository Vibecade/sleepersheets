
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, ArrowRight } from 'lucide-react';

interface LeagueIdInputProps {
  leagueId: string;
  setLeagueId: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export const LeagueIdInput = ({ leagueId, setLeagueId, onSubmit, loading }: LeagueIdInputProps) => {
  return (
    <div className="group">
      <Label htmlFor="leagueId" className="text-white text-sm font-semibold mb-3 block">
        League ID (Direct Access)
      </Label>
      <div className="flex space-x-3">
        <Input
          id="leagueId"
          placeholder="e.g., 123456789"
          value={leagueId}
          onChange={(e) => setLeagueId(e.target.value)}
          className="flex-1 h-12 text-lg group-hover:border-emerald-400/50 transition-all duration-300"
        />
        <Button 
          onClick={onSubmit} 
          disabled={loading}
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
    </div>
  );
};


import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Hash } from 'lucide-react';

interface LeagueIdInputProps {
  leagueId: string;
  setLeagueId: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export const LeagueIdInput = ({ leagueId, setLeagueId, onSubmit, loading }: LeagueIdInputProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="leagueId" className="text-white text-sm font-semibold flex items-center gap-2">
          <Hash className="w-4 h-4 text-blue-400" />
          League ID (Direct Access)
        </Label>
        <p className="text-xs text-slate-400 leading-relaxed">
          The fastest way to connect. Find your League ID in your Sleeper app URL.
        </p>
      </div>
      
      <div className="relative">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Input
              id="leagueId"
              placeholder="123456789012345678"
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
              className="h-12 text-base pl-4 pr-4 glass border-slate-600/50 hover:border-slate-500 focus:border-blue-400 transition-all duration-300 text-white placeholder:text-slate-500"
            />
            {leagueId && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
            )}
          </div>
          
          <Button 
            onClick={onSubmit} 
            disabled={loading || !leagueId.trim()}
            size="lg"
            className="px-6 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

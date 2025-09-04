import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Loader2, RefreshCw, X } from 'lucide-react';
import { useSleeperUser } from '@/hooks/useSleeperUser';

const SleeperUsernameForm: React.FC = () => {
  const {
    sleeperUsername,
    sleeperUser,
    saving,
    saveSleeperUsername,
    clearSleeperData,
    refreshLeagues
  } = useSleeperUser();

  const [inputValue, setInputValue] = useState(sleeperUsername);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const success = await saveSleeperUsername(inputValue.trim());
    if (!success) {
      setInputValue(sleeperUsername); // Reset to previous value on failure
    }
  };

  const handleClear = async () => {
    await clearSleeperData();
    setInputValue('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-500" />
          <span>Sleeper Account</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sleeperUser ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <Avatar className="w-10 h-10">
                {sleeperUser.avatar ? (
                  <AvatarImage 
                    src={`https://sleepercdn.com/avatars/thumbs/${sleeperUser.avatar}`} 
                    alt={sleeperUser.display_name || sleeperUser.username}
                  />
                ) : null}
                <AvatarFallback>
                  {(sleeperUser.display_name || sleeperUser.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-white">
                    {sleeperUser.display_name || sleeperUser.username}
                  </span>
                  <Badge variant="secondary" className="text-xs">Connected</Badge>
                </div>
                <p className="text-sm text-gray-400">@{sleeperUser.username}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshLeagues}
                className="flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Leagues</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="flex items-center space-x-1 text-red-400 border-red-400 hover:bg-red-400/10"
              >
                <X className="w-3 h-3" />
                <span>Disconnect</span>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="sleeper-username">Sleeper Username</Label>
              <Input
                id="sleeper-username"
                type="text"
                placeholder="Enter your Sleeper username"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={saving}
                className="bg-gray-800/50 border-gray-600"
              />
              <p className="text-xs text-gray-400">
                Enter your Sleeper username to automatically load your leagues
              </p>
            </div>
            <Button
              type="submit"
              disabled={!inputValue.trim() || saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Sleeper Account'
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default SleeperUsernameForm;
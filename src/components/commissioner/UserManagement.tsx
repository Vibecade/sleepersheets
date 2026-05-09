import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCommissionerActions } from '@/hooks/useCommissionerActions';
import { useToast } from '@/hooks/use-toast';
import { useReadOnly } from '@/contexts/read-only-context';
import { Users, UserCheck, Search, Crown } from 'lucide-react';
import OwnershipTransferDialog from '@/components/league/OwnershipTransferDialog';
import { getTeamName } from '@/utils/leagueDataUtils';

interface UserManagementProps {
  leagueId: string;
  leagueData: any;
}

export const UserManagement = ({ leagueId, leagueData }: UserManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const { logAction } = useCommissionerActions(leagueId);
  const { toast } = useToast();
  const { readOnly } = useReadOnly();

  const rosters = leagueData?.rosters || [];

  // Upstream LeagueData passes `users` as Object.values(userMap) (an array),
  // but historically this component indexed it as a map — every lookup
  // returned undefined and team names fell back to "Team N". Normalize to a
  // map keyed by user_id so getTeamName() can resolve metadata.team_name
  // (custom Sleeper team names) rather than always landing on the fallback.
  const userMap: Record<string, any> = useMemo(() => {
    const raw = leagueData?.users;
    if (!raw) return {};
    if (Array.isArray(raw)) {
      return raw.reduce<Record<string, any>>((acc, user) => {
        if (user?.user_id) acc[user.user_id] = user;
        return acc;
      }, {});
    }
    return raw as Record<string, any>;
  }, [leagueData?.users]);

  // Filter rosters based on search term — match against team name, owner
  // display name, and username so any of them works.
  const filteredRosters = rosters.filter((roster: any) => {
    const user = userMap[roster.owner_id];
    const teamName = getTeamName(user);
    const ownerHandle = user?.display_name || user?.username || '';
    const haystack = `${teamName} ${ownerHandle}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  const handleTransferOwnership = async (rosterId: string, newOwnerId: string) => {
    if (readOnly) return;
    try {
      await logAction({
        action_type: 'ownership_transfer',
        target_type: 'roster',
        target_id: rosterId,
        description: `Transferred team ownership to user ${newOwnerId}`,
        metadata: { 
          roster_id: rosterId,
          new_owner_id: newOwnerId,
          previous_owner_id: rosters.find((r: any) => r.roster_id === parseInt(rosterId))?.owner_id
        }
      });

      toast({
        title: "Ownership Transferred",
        description: "Team ownership has been successfully transferred.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to transfer ownership. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">User Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage team owners and user permissions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Team Owners
          </CardTitle>
          <CardDescription>
            View and manage all team owners in your league
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search team owners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="space-y-3">
            {filteredRosters.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No team owners found matching your search criteria.
                </AlertDescription>
              </Alert>
            ) : (
              filteredRosters.map((roster: any) => {
                const user = userMap[roster.owner_id];
                const teamName = getTeamName(user);
                const ownerHandle = user?.display_name || user?.username;
                const initials = teamName
                  .split(' ')
                  .map((part: string) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={roster.roster_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        {user?.avatar && (
                          <AvatarImage
                            src={`https://sleepercdn.com/avatars/thumbs/${user.avatar}`}
                            alt={`${teamName} avatar`}
                          />
                        )}
                        <AvatarFallback>{initials || '??'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{teamName}</p>
                          <Badge variant="outline">Slot #{roster.roster_id}</Badge>
                          {roster.co_owners && roster.co_owners.length > 0 && (
                            <Badge variant="secondary">
                              +{roster.co_owners.length} co-owner{roster.co_owners.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <UserCheck className="h-3 w-3" />
                          <span>
                            {ownerHandle
                              ? `Owner: ${ownerHandle}`
                              : 'Owner not found in league users'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTransferDialog(true)}
                        className="gap-2"
                        disabled={readOnly}
                      >
                        <Crown className="h-3 w-3" />
                        Transfer
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>League Statistics</CardTitle>
          <CardDescription>
            Overview of your league's user activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{rosters.length}</div>
              <p className="text-sm text-muted-foreground">Total Teams</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {Object.keys(userMap).length}
              </div>
              <p className="text-sm text-muted-foreground">Unique Users</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {rosters.reduce((acc: number, roster: any) => 
                  acc + (roster.co_owners ? roster.co_owners.length : 0), 0
                )}
              </div>
              <p className="text-sm text-muted-foreground">Co-Owners</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <OwnershipTransferDialog
        isOpen={showTransferDialog}
        onClose={() => setShowTransferDialog(false)}
        leagueId={leagueId}
        onTransferComplete={handleTransferOwnership}
      />
    </div>
  );
};
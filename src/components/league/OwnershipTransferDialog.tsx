import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, AlertTriangle } from 'lucide-react';

interface OwnershipTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leagueId: string;
  onTransferComplete: (rosterId: string, newOwnerId: string) => void;
}

const OwnershipTransferDialog = ({
  isOpen,
  onClose,
  leagueId,
  onTransferComplete
}: OwnershipTransferDialogProps) => {
  const [rosterId, setRosterId] = useState('');
  const [newOwnerId, setNewOwnerId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!rosterId || !newOwnerId) return;
    
    setLoading(true);
    try {
      await onTransferComplete(rosterId, newOwnerId);
      setRosterId('');
      setNewOwnerId('');
      onClose();
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Transfer Team Ownership
          </DialogTitle>
          <DialogDescription>
            Transfer ownership of a team to a different user. This action requires careful consideration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This is a commissioner-only action. Make sure you have the correct roster and user IDs.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="rosterId">Roster ID</Label>
            <Input
              id="rosterId"
              type="number"
              placeholder="Enter roster ID (e.g., 1, 2, 3...)"
              value={rosterId}
              onChange={(e) => setRosterId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The team roster number to transfer
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newOwnerId">New Owner User ID</Label>
            <Input
              id="newOwnerId"
              placeholder="Enter Sleeper user ID"
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The Sleeper user ID of the new owner
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer} 
            disabled={!rosterId || !newOwnerId || loading}
          >
            {loading ? 'Transferring...' : 'Transfer Ownership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OwnershipTransferDialog;
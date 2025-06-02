
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserMinus, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OwnershipTransferDialogProps {
  leagueId: string;
  leagueName: string;
  onTransferComplete: () => void;
}

const OwnershipTransferDialog: React.FC<OwnershipTransferDialogProps> = ({
  leagueId,
  leagueName,
  onTransferComplete
}) => {
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleTransfer = async () => {
    if (!user || !newOwnerEmail.trim()) return;

    setLoading(true);
    try {
      // First, find the user by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newOwnerEmail.trim())
        .single();

      if (profileError || !profiles) {
        toast({
          title: "User Not Found",
          description: "No user found with that email address",
          variant: "destructive"
        });
        return;
      }

      // Update ownership
      const { error: updateError } = await supabase
        .from('league_ownership')
        .update({ user_id: profiles.id })
        .eq('league_id', leagueId)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (updateError) {
        console.error('Error transferring ownership:', updateError);
        toast({
          title: "Transfer Failed",
          description: "Failed to transfer league ownership",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Ownership Transferred",
        description: `League ownership has been transferred to ${newOwnerEmail}`
      });

      setOpen(false);
      setNewOwnerEmail('');
      setShowConfirmation(false);
      onTransferComplete();
    } catch (error) {
      console.error('Error transferring ownership:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOwnerEmail.trim()) {
      setShowConfirmation(true);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center space-x-2 text-orange-400 border-orange-400/20 hover:bg-orange-400/10">
            <UserMinus className="w-4 h-4" />
            <span>Transfer</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer League Ownership</DialogTitle>
            <DialogDescription>
              Transfer ownership of "{leagueName}" to another user. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-owner-email">New Owner Email</Label>
              <Input
                id="new-owner-email"
                type="email"
                placeholder="Enter the new owner's email"
                value={newOwnerEmail}
                onChange={(e) => setNewOwnerEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!newOwnerEmail.trim()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Transfer Ownership
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>Confirm Ownership Transfer</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to transfer ownership of "{leagueName}" to {newOwnerEmail}?
              <br /><br />
              <strong>This action cannot be undone.</strong> You will lose all administrative rights to this league.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTransfer}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {loading ? 'Transferring...' : 'Transfer Ownership'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OwnershipTransferDialog;

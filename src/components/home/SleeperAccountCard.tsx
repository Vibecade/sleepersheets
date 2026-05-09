import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { RefreshCw, X } from 'lucide-react';
import type { SleeperUser } from '@/types/sleeper';

interface SleeperAccountCardProps {
  user: SleeperUser;
  onRefresh: () => void;
  onDisconnect: () => void;
  refreshing?: boolean;
}

export const SleeperAccountCard: React.FC<SleeperAccountCardProps> = ({
  user,
  onRefresh,
  onDisconnect,
  refreshing = false,
}) => {
  const displayName = user.display_name || user.username;
  return (
    <div
      className="bg-card border border-border px-5 py-5 sm:px-7 sm:py-6"
      style={{ borderTop: '2px solid hsl(var(--primary))' }}
    >
      <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto_auto] gap-4 sm:gap-5 items-center">
        <Avatar
          className="w-14 h-14 bg-primary"
          style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }}
        >
          {user.avatar ? (
            <AvatarImage
              src={`https://sleepercdn.com/avatars/thumbs/${user.avatar}`}
              alt={displayName}
            />
          ) : null}
          <AvatarFallback
            className="bg-primary text-primary-foreground font-headline font-bold"
            style={{ fontSize: 22 }}
          >
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div
            className="font-mono text-muted-foreground mb-1"
            style={{ fontSize: 10, letterSpacing: '0.2em' }}
          >
            SLEEPER ACCOUNT
          </div>
          <div
            className="font-headline font-bold text-foreground truncate"
            style={{ fontSize: 22, letterSpacing: '0.05em' }}
          >
            {displayName.toUpperCase()}
          </div>
          <div
            className="font-mono text-muted-foreground mt-1"
            style={{ fontSize: 11, letterSpacing: '0.1em' }}
          >
            @{user.username} · CONNECTED
          </div>
        </div>

        <span
          className="hidden sm:inline-flex items-center justify-center font-mono font-bold text-primary border border-primary px-3 py-1.5"
          style={{ fontSize: 10, letterSpacing: '0.15em' }}
        >
          ● LIVE
        </span>

        <div className="col-span-2 sm:col-span-1 flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-transparent text-foreground font-mono font-semibold uppercase border hover:border-primary/60 transition-colors disabled:opacity-60"
            style={{ fontSize: 11, letterSpacing: '0.15em', borderColor: 'hsl(var(--border-light))' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={onDisconnect}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-transparent text-secondary font-mono font-semibold uppercase border hover:border-secondary/60 transition-colors"
            style={{ fontSize: 11, letterSpacing: '0.15em', borderColor: 'hsl(var(--border-light))' }}
          >
            <X className="w-3.5 h-3.5" />
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};

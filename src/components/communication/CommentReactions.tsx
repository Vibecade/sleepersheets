import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const REACTION_EMOJIS = {
  like: '👍',
  dislike: '👎',
  laugh: '😂',
  fire: '🔥',
  thinking: '🤔'
} as const;

type ReactionType = keyof typeof REACTION_EMOJIS;

interface Reaction {
  id: string;
  user_id: string;
  reaction_type: string;
}

interface CommentReactionsProps {
  commentId: string;
  className?: string;
}

export function CommentReactions({ commentId, className }: CommentReactionsProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);

  const fetchReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('comment_reactions')
        .select('*')
        .eq('comment_id', commentId);

      if (error) throw error;

      setReactions(data || []);
      
      if (user) {
        const userReactionData = data?.find(r => r.user_id === user.id);
        setUserReaction((userReactionData?.reaction_type as ReactionType) || null);
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const toggleReaction = async (reactionType: ReactionType) => {
    if (!user) return;

    try {
      if (userReaction === reactionType) {
        // Remove reaction
        await supabase
          .from('comment_reactions')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        // Add or update reaction
        await supabase
          .from('comment_reactions')
          .upsert({
            comment_id: commentId,
            user_id: user.id,
            reaction_type: reactionType
          });
      }
      
      fetchReactions();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  useEffect(() => {
    fetchReactions();
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`reactions-${commentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_reactions',
          filter: `comment_id=eq.${commentId}`
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [commentId, user]);

  const getReactionCount = (type: ReactionType) => {
    return reactions.filter(r => r.reaction_type === type).length;
  };

  const getTopReactions = () => {
    const counts = Object.entries(REACTION_EMOJIS).map(([type, emoji]) => ({
      type: type as ReactionType,
      emoji,
      count: getReactionCount(type as ReactionType)
    })).filter(r => r.count > 0).sort((a, b) => b.count - a.count);

    return counts.slice(0, 3); // Show top 3 reactions
  };

  const topReactions = getTopReactions();

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {/* Show existing reactions with counts */}
      {topReactions.map(({ type, emoji, count }) => (
        <Button
          key={type}
          variant="ghost"
          size="sm"
          onClick={() => toggleReaction(type)}
          className={cn(
            "h-auto p-1 text-xs space-x-1 hover:bg-muted",
            userReaction === type && "bg-primary/10 text-primary"
          )}
        >
          <span>{emoji}</span>
          <span>{count}</span>
        </Button>
      ))}

      {/* Quick reaction buttons for common ones */}
      {topReactions.length < 3 && (
        <>
          {(['like', 'fire', 'laugh'] as const).map(type => {
            if (topReactions.some(r => r.type === type)) return null;
            
            return (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                onClick={() => toggleReaction(type)}
                className={cn(
                  "h-auto p-1 text-xs opacity-50 hover:opacity-100 hover:bg-muted",
                  userReaction === type && "bg-primary/10 text-primary opacity-100"
                )}
              >
                {REACTION_EMOJIS[type]}
              </Button>
            );
          })}
        </>
      )}
    </div>
  );
}
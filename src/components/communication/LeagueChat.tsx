import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Send, MessageCircle, Reply, Smile } from 'lucide-react';
import { CommentReactions } from './CommentReactions';

interface Comment {
  id: string;
  content: string;
  comment_type: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
    sleeper_username: string | null;
  } | null;
  replies?: Comment[];
}

interface LeagueChatProps {
  leagueId: string;
  className?: string;
}

export function LeagueChat({ leagueId, className }: LeagueChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('league_comments')
        .select('*')
        .eq('league_id', leagueId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profile data separately for each comment
      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, sleeper_username')
            .eq('id', comment.user_id)
            .single();
          
          return { ...comment, profiles: profile };
        })
      );

      // Organize comments into threads
      const topLevelComments = commentsWithProfiles.filter(comment => !comment.parent_id);
      const repliesMap = new Map<string, Comment[]>();
      
      commentsWithProfiles.filter(comment => comment.parent_id).forEach(reply => {
        const parentId = reply.parent_id!;
        if (!repliesMap.has(parentId)) {
          repliesMap.set(parentId, []);
        }
        repliesMap.get(parentId)!.push(reply);
      });

      const commentsWithReplies = topLevelComments.map(comment => ({
        ...comment,
        replies: repliesMap.get(comment.id) || []
      }));

      setComments(commentsWithReplies);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load league chat",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('league_comments')
        .insert({
          league_id: leagueId,
          user_id: user.id,
          content: newComment.trim(),
          parent_id: replyTo,
          comment_type: 'general'
        });

      if (error) throw error;

      setNewComment('');
      setReplyTo(null);
      
      // Create activity entry
      await supabase
        .from('league_activities')
        .insert({
          league_id: leagueId,
          activity_type: 'comment',
          title: 'New Comment',
          description: `${user.email} posted a comment`,
          user_id: user.id,
          metadata: { comment_preview: newComment.slice(0, 100) }
        });

    } catch (error) {
      console.error('Error sending comment:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchComments();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('league-chat')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'league_comments',
          filter: `league_id=eq.${leagueId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leagueId]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const renderComment = (comment: Comment, isReply = false) => {
    const displayName = comment.profiles?.full_name || 
                       comment.profiles?.sleeper_username || 
                       'Anonymous';
    
    return (
      <div key={comment.id} className={`flex space-x-3 ${isReply ? 'ml-8 mt-2' : 'mb-4'}`}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.profiles?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-foreground">
              {displayName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.comment_type !== 'general' && (
              <Badge variant="secondary" className="text-xs">
                {comment.comment_type}
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-foreground mb-2 break-words">
            {comment.content}
          </p>
          
          <div className="flex items-center space-x-2">
            <CommentReactions commentId={comment.id} />
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(comment.id)}
                className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
          </div>
          
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>League Chat</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="h-8 w-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>League Chat</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-4 px-1">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            comments.map(comment => renderComment(comment))
          )}
          <div ref={messagesEndRef} />
        </div>

        {replyTo && (
          <div className="bg-muted p-2 rounded-md text-sm">
            <span className="text-muted-foreground">Replying to message</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyTo(null)}
              className="ml-2 h-auto p-1 text-xs"
            >
              Cancel
            </Button>
          </div>
        )}

        <div className="flex space-x-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyTo ? "Write a reply..." : "Type your message..."}
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendComment();
              }
            }}
          />
          <Button
            onClick={sendComment}
            disabled={!newComment.trim() || !user}
            size="sm"
            className="h-[60px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
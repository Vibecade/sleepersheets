-- League comments system for real-time chat
CREATE TABLE public.league_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  comment_type TEXT DEFAULT 'general', -- 'general', 'trade', 'announcement'
  parent_id UUID REFERENCES public.league_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on league comments
ALTER TABLE public.league_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for league comments
CREATE POLICY "Users can view comments for their leagues" 
ON public.league_comments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.league_ownership 
    WHERE league_ownership.league_id = league_comments.league_id 
    AND league_ownership.user_id = auth.uid() 
    AND league_ownership.is_active = true
  )
);

CREATE POLICY "Users can create comments in their leagues" 
ON public.league_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.league_ownership 
    WHERE league_ownership.league_id = league_comments.league_id 
    AND league_ownership.user_id = auth.uid() 
    AND league_ownership.is_active = true
  )
);

CREATE POLICY "Users can update their own comments" 
ON public.league_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.league_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  trade_deadline_notifications BOOLEAN DEFAULT true,
  waiver_notifications BOOLEAN DEFAULT true,
  league_activity_notifications BOOLEAN DEFAULT true,
  push_notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification preferences
CREATE POLICY "Users can manage their own notification preferences" 
ON public.notification_preferences 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Comment reactions table
CREATE TABLE public.comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES public.league_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike', 'laugh', 'fire', 'thinking')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS on comment reactions
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for comment reactions
CREATE POLICY "Users can view reactions for comments they can see" 
ON public.comment_reactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.league_comments lc
    JOIN public.league_ownership lo ON lc.league_id = lo.league_id
    WHERE lc.id = comment_reactions.comment_id 
    AND lo.user_id = auth.uid() 
    AND lo.is_active = true
  )
);

CREATE POLICY "Users can manage their own reactions" 
ON public.comment_reactions 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- League activity feed table
CREATE TABLE public.league_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('trade', 'waiver', 'comment', 'announcement', 'contract_update')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on league activities
ALTER TABLE public.league_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for league activities
CREATE POLICY "Users can view activities for their leagues" 
ON public.league_activities 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.league_ownership 
    WHERE league_ownership.league_id = league_activities.league_id 
    AND league_ownership.user_id = auth.uid() 
    AND league_ownership.is_active = true
  )
);

CREATE POLICY "System can insert league activities" 
ON public.league_activities 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for these tables
ALTER TABLE public.league_comments REPLICA IDENTITY FULL;
ALTER TABLE public.comment_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.league_activities REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.league_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.league_activities;

-- Create indexes for better performance
CREATE INDEX idx_league_comments_league_id ON public.league_comments(league_id);
CREATE INDEX idx_league_comments_user_id ON public.league_comments(user_id);
CREATE INDEX idx_league_comments_created_at ON public.league_comments(created_at DESC);
CREATE INDEX idx_comment_reactions_comment_id ON public.comment_reactions(comment_id);
CREATE INDEX idx_league_activities_league_id ON public.league_activities(league_id);
CREATE INDEX idx_league_activities_created_at ON public.league_activities(created_at DESC);

-- Create trigger for updated_at on league_comments
CREATE TRIGGER update_league_comments_updated_at
BEFORE UPDATE ON public.league_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
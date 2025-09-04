-- Add sleeper_username field to profiles table for storing user's Sleeper username
ALTER TABLE public.profiles ADD COLUMN sleeper_username TEXT;
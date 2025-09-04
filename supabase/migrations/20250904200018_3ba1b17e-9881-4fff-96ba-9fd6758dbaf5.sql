-- Fix security issue: Remove overly permissive policy that allows public access to all profiles
-- This policy was allowing anyone to view all user profiles including emails, full names, and avatar URLs
-- We keep the existing policy that allows users to view only their own profile

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Verify that the secure policy still exists (users can only view their own profile)
-- This policy should remain: "Users can view their own profile" with condition (auth.uid() = id)
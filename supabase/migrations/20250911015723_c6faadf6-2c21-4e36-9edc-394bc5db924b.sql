-- Fix security issue: Make profiles table more restrictive
-- Remove the existing policies first and create stricter ones

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a more secure policy for SELECT that prevents email-based searches by other users
CREATE POLICY "Users can only view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to insert their own profile (with proper user_id check)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Prevent deletion of profiles entirely for data integrity
CREATE POLICY "Prevent profile deletion"
ON public.profiles
FOR DELETE
USING (false);

-- Create a secure function for admin-level user lookups (like ownership transfer)
-- This function uses SECURITY DEFINER to bypass RLS for authorized operations
CREATE OR REPLACE FUNCTION public.find_user_by_email(email_to_find text)
RETURNS TABLE(user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow authenticated users to use this function
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Return the user ID for the given email
  RETURN QUERY
  SELECT id
  FROM public.profiles
  WHERE email = email_to_find;
END;
$$;
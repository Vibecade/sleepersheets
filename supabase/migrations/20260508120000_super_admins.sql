-- Read-only super admin support.
-- Super admins can SELECT from commissioner-only tables but never write,
-- enforced via additive RLS policies. The UI also disables write affordances.

CREATE TABLE public.super_admins (
  email TEXT PRIMARY KEY,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- A super admin can confirm their own membership; the table itself does not
-- leak the full list to anyone else.
CREATE POLICY "Super admins can view their own row"
ON public.super_admins
FOR SELECT
USING (email = (auth.jwt() ->> 'email'));

-- Helper: is the current JWT email a super admin?
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.super_admins
    WHERE email = (auth.jwt() ->> 'email')
  );
$$;

-- Additive read policies on commissioner-only tables. Existing
-- league-owner write/select policies are left untouched.
CREATE POLICY "Super admins can view commissioner actions"
ON public.commissioner_actions
FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Super admins can view transaction overrides"
ON public.transaction_overrides
FOR SELECT
USING (public.is_super_admin());

-- Lightweight audit log of super admin commissioner-area views.
CREATE TABLE public.super_admin_access_log (
  id BIGSERIAL PRIMARY KEY,
  viewer_email TEXT NOT NULL,
  league_id TEXT,
  route TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.super_admin_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view access log"
ON public.super_admin_access_log
FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Super admins can insert their own access log entries"
ON public.super_admin_access_log
FOR INSERT
WITH CHECK (
  public.is_super_admin()
  AND viewer_email = (auth.jwt() ->> 'email')
);

CREATE INDEX idx_super_admin_access_log_viewed_at
ON public.super_admin_access_log (viewed_at DESC);

CREATE INDEX idx_super_admin_access_log_league
ON public.super_admin_access_log (league_id, viewed_at DESC);

-- Seed the initial super admin.
INSERT INTO public.super_admins (email)
VALUES ('jsethereum@gmail.com')
ON CONFLICT DO NOTHING;

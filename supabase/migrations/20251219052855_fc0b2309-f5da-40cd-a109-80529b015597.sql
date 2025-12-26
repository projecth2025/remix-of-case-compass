-- Fix profiles table RLS - restrict to own profile only for sensitive data
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can only view their own profile data (for privacy)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Users can view basic info (name only) of other users for collaboration
-- This requires a separate query approach in the app

-- Fix invitations table RLS - proper access control
DROP POLICY IF EXISTS "Users can create invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can delete invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can update invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.invitations;

-- View invitations: either you sent them or they're addressed to your email
CREATE POLICY "Users can view relevant invitations" 
ON public.invitations 
FOR SELECT 
USING (
  invited_by_id = auth.uid() OR 
  invited_user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- Create invitations: only if you're the inviter
CREATE POLICY "Users can create own invitations" 
ON public.invitations 
FOR INSERT 
WITH CHECK (invited_by_id = auth.uid());

-- Update invitations: invitee can update status, inviter can update their own
CREATE POLICY "Users can update relevant invitations" 
ON public.invitations 
FOR UPDATE 
USING (
  invited_by_id = auth.uid() OR 
  invited_user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- Delete invitations: only the inviter can delete
CREATE POLICY "Inviters can delete invitations" 
ON public.invitations 
FOR DELETE 
USING (invited_by_id = auth.uid());
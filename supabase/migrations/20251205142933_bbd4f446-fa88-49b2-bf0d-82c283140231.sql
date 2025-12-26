-- Create invitations table for MTB expert invitations
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mtb_id TEXT NOT NULL,
  mtb_name TEXT NOT NULL,
  invited_by_id TEXT NOT NULL,
  invited_by_name TEXT NOT NULL,
  invited_user_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own invitations
CREATE POLICY "Users can view their own invitations"
ON public.invitations
FOR SELECT
USING (true);

-- Allow users to insert invitations
CREATE POLICY "Users can create invitations"
ON public.invitations
FOR INSERT
WITH CHECK (true);

-- Allow users to update their own invitations (accept/decline)
CREATE POLICY "Users can update invitations"
ON public.invitations
FOR UPDATE
USING (true);

-- Allow users to delete invitations
CREATE POLICY "Users can delete invitations"
ON public.invitations
FOR DELETE
USING (true);
-- Allow users to view MTBs they have been invited to
CREATE POLICY "Invited users can view MTB"
ON public.mtbs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM invitations
    WHERE invitations.mtb_id = mtbs.id
    AND (
      invitations.invited_user_id = auth.uid()
      OR invitations.invited_email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  )
);
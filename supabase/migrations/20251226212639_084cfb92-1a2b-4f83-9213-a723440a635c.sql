-- Drop the existing owner-only policy for creating meetings
DROP POLICY IF EXISTS "MTB owners can create meetings" ON public.meetings;

-- Create new policy allowing all MTB members to create meetings
CREATE POLICY "MTB members can create meetings"
ON public.meetings
FOR INSERT
WITH CHECK (is_mtb_member(auth.uid(), mtb_id));

-- Update the policy for updating meetings to allow the creator
DROP POLICY IF EXISTS "Creators can update meetings" ON public.meetings;
CREATE POLICY "Creators can update meetings"
ON public.meetings
FOR UPDATE
USING (created_by = auth.uid());

-- Keep delete policy for creators only
DROP POLICY IF EXISTS "Creators can delete meetings" ON public.meetings;
CREATE POLICY "Creators can delete meetings"
ON public.meetings
FOR DELETE
USING (created_by = auth.uid() OR is_mtb_owner(auth.uid(), mtb_id));
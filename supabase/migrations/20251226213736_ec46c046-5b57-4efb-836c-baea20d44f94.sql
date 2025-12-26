-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "MTB members can view memberships" ON public.mtb_members;

-- Create new policy allowing all MTB members to see other members in the same MTB
CREATE POLICY "MTB members can view all memberships in their MTBs"
ON public.mtb_members
FOR SELECT
USING (
  is_mtb_member(auth.uid(), mtb_id)
);
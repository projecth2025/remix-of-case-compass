-- Drop the existing overly-permissive MTB owners policy for mtb_cases
DROP POLICY IF EXISTS "MTB owners can manage cases" ON public.mtb_cases;

-- Create a specific DELETE policy that only allows the case-adder to remove
CREATE POLICY "Case adder can remove from MTB"
ON public.mtb_cases
FOR DELETE
USING (added_by = auth.uid());

-- Create UPDATE policy for the case adder (if needed in future)
CREATE POLICY "Case adder can update mtb_case"
ON public.mtb_cases
FOR UPDATE
USING (added_by = auth.uid());
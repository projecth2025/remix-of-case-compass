-- Create a helper function in the public schema to check MTB membership for case documents
CREATE OR REPLACE FUNCTION public.is_mtb_member_for_case_path(file_path text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  path_parts text[];
  owner_id text;
  case_id_from_path text;
BEGIN
  -- Split the path: owner_id/case_id/filename
  path_parts := string_to_array(file_path, '/');
  
  -- Need at least 3 parts
  IF array_length(path_parts, 1) < 3 THEN
    RETURN FALSE;
  END IF;
  
  owner_id := path_parts[1];
  case_id_from_path := path_parts[2];
  
  -- Check if user is owner of the file
  IF owner_id = auth.uid()::text THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a member of an MTB that contains this case
  RETURN EXISTS (
    SELECT 1 
    FROM public.mtb_cases mc
    JOIN public.mtb_members mm ON mc.mtb_id = mm.mtb_id
    WHERE mc.case_id::text = case_id_from_path
    AND mm.user_id = auth.uid()
  );
END;
$$;
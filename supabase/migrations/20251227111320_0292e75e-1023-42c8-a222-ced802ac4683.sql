-- Add storage policy to allow MTB members to view shared case documents
CREATE POLICY "MTB members can view shared case documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'case-documents' 
  AND public.is_mtb_member_for_case_path(name)
);
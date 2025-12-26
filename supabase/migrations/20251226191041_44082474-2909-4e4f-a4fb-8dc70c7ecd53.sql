-- Create storage bucket for case documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-documents', 'case-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for case-documents bucket
CREATE POLICY "Users can view own case documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'case-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own case documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'case-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own case documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'case-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own case documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'case-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
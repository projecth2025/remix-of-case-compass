-- Drop existing tables if they need restructuring
DROP TABLE IF EXISTS public.uploaded_files CASCADE;
DROP TABLE IF EXISTS public.document_edit_tracking CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- Recreate cases table with correct schema
DROP TABLE IF EXISTS public.cases CASCADE;
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_name TEXT NOT NULL,
  cancer_type TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived'))
);

-- Add unique constraint on case_name per user
CREATE UNIQUE INDEX idx_cases_case_name_user ON public.cases(case_name, created_by);

-- Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- RLS policies for cases
CREATE POLICY "Users can view own cases" 
  ON public.cases FOR SELECT 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create own cases" 
  ON public.cases FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own cases" 
  ON public.cases FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own cases" 
  ON public.cases FOR DELETE 
  USING (auth.uid() = created_by);

-- Drop and recreate patients table with correct schema
DROP TABLE IF EXISTS public.patients CASCADE;
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  anonymized_name TEXT NOT NULL,
  age INTEGER,
  sex TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- RLS policies for patients (via case ownership)
CREATE POLICY "Users can view patients for own cases" 
  ON public.patients FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = patients.case_id AND cases.created_by = auth.uid()
  ));

CREATE POLICY "Users can create patients for own cases" 
  ON public.patients FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = patients.case_id AND cases.created_by = auth.uid()
  ));

CREATE POLICY "Users can update patients for own cases" 
  ON public.patients FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = patients.case_id AND cases.created_by = auth.uid()
  ));

CREATE POLICY "Users can delete patients for own cases" 
  ON public.patients FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = patients.case_id AND cases.created_by = auth.uid()
  ));

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf')),
  file_category TEXT,
  page_count INTEGER DEFAULT 1,
  storage_path TEXT,
  anonymized_file_url TEXT,
  digitized_text JSONB,
  is_anonymized BOOLEAN NOT NULL DEFAULT false,
  is_digitized BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for documents (via case ownership)
CREATE POLICY "Users can view documents for own cases" 
  ON public.documents FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = documents.case_id AND cases.created_by = auth.uid()
  ));

CREATE POLICY "Users can create documents for own cases" 
  ON public.documents FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = documents.case_id AND cases.created_by = auth.uid()
  ));

CREATE POLICY "Users can update documents for own cases" 
  ON public.documents FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = documents.case_id AND cases.created_by = auth.uid()
  ));

CREATE POLICY "Users can delete documents for own cases" 
  ON public.documents FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = documents.case_id AND cases.created_by = auth.uid()
  ));

-- Create document_edit_tracking table
CREATE TABLE public.document_edit_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  last_edited_stage TEXT NOT NULL CHECK (last_edited_stage IN ('upload', 'anonymize', 'digitize')),
  requires_revisit BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_edit_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_edit_tracking (via document -> case ownership)
CREATE POLICY "Users can view tracking for own documents" 
  ON public.document_edit_tracking FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.cases c ON c.id = d.case_id
    WHERE d.id = document_edit_tracking.document_id AND c.created_by = auth.uid()
  ));

CREATE POLICY "Users can create tracking for own documents" 
  ON public.document_edit_tracking FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.cases c ON c.id = d.case_id
    WHERE d.id = document_edit_tracking.document_id AND c.created_by = auth.uid()
  ));

CREATE POLICY "Users can update tracking for own documents" 
  ON public.document_edit_tracking FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.cases c ON c.id = d.case_id
    WHERE d.id = document_edit_tracking.document_id AND c.created_by = auth.uid()
  ));

CREATE POLICY "Users can delete tracking for own documents" 
  ON public.document_edit_tracking FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.cases c ON c.id = d.case_id
    WHERE d.id = document_edit_tracking.document_id AND c.created_by = auth.uid()
  ));

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('case', 'document', 'patient')),
  entity_id UUID NOT NULL,
  edited_by UUID NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_summary TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit_logs (users can see their own edits)
CREATE POLICY "Users can view own audit logs" 
  ON public.audit_logs FOR SELECT 
  USING (auth.uid() = edited_by);

CREATE POLICY "Users can create audit logs" 
  ON public.audit_logs FOR INSERT 
  WITH CHECK (auth.uid() = edited_by);

-- Create trigger to update updated_at on cases
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to update last_modified_at on documents
CREATE OR REPLACE FUNCTION public.update_last_modified_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_documents_last_modified_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_modified_at_column();

-- Create storage bucket for case documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-documents', 
  'case-documents', 
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for case-documents bucket
CREATE POLICY "Users can upload own case documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'case-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own case documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'case-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own case documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'case-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own case documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'case-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
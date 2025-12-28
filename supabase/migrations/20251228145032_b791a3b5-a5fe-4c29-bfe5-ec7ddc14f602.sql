-- =====================================================
-- VMTB Database Schema (Fixed Order)
-- =====================================================

-- 1. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  profession TEXT,
  hospital_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. CASES TABLE
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_name TEXT NOT NULL,
  cancer_type TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cases" ON public.cases
  FOR SELECT TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Users can create cases" ON public.cases
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own cases" ON public.cases
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own cases" ON public.cases
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- 3. PATIENTS TABLE
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  anonymized_name TEXT,
  age INTEGER,
  sex TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view patients of their cases" ON public.patients
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.cases WHERE cases.id = patients.case_id AND cases.created_by = auth.uid())
  );

CREATE POLICY "Users can insert patients for their cases" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_id AND cases.created_by = auth.uid())
  );

CREATE POLICY "Users can update patients of their cases" ON public.patients
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.cases WHERE cases.id = patients.case_id AND cases.created_by = auth.uid())
  );

CREATE POLICY "Users can delete patients of their cases" ON public.patients
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.cases WHERE cases.id = patients.case_id AND cases.created_by = auth.uid())
  );

-- 4. DOCUMENTS TABLE
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_category TEXT,
  page_count INTEGER NOT NULL DEFAULT 1,
  storage_path TEXT,
  anonymized_file_url TEXT,
  digitized_text JSONB,
  is_anonymized BOOLEAN NOT NULL DEFAULT false,
  is_digitized BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents of their cases" ON public.documents
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.cases WHERE cases.id = documents.case_id AND cases.created_by = auth.uid())
  );

CREATE POLICY "Users can insert documents for their cases" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_id AND cases.created_by = auth.uid())
  );

CREATE POLICY "Users can update documents of their cases" ON public.documents
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.cases WHERE cases.id = documents.case_id AND cases.created_by = auth.uid())
  );

CREATE POLICY "Users can delete documents of their cases" ON public.documents
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.cases WHERE cases.id = documents.case_id AND cases.created_by = auth.uid())
  );

-- 5. DOCUMENT EDIT TRACKING TABLE
CREATE TABLE public.document_edit_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  last_edited_stage TEXT NOT NULL CHECK (last_edited_stage IN ('upload', 'anonymize', 'digitize')),
  requires_revisit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_edit_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage edit tracking for their documents" ON public.document_edit_tracking
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.documents d 
      JOIN public.cases c ON c.id = d.case_id 
      WHERE d.id = document_edit_tracking.document_id AND c.created_by = auth.uid()
    )
  );

-- 6. AUDIT LOGS TABLE
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  edited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  change_summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (edited_by = auth.uid());

CREATE POLICY "Users can create audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (edited_by = auth.uid());

-- 7. MTBs TABLE (without member check in RLS - will add later)
CREATE TABLE public.mtbs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  dp_image TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mtbs ENABLE ROW LEVEL SECURITY;

-- Temporary policy - will be replaced after mtb_members is created
CREATE POLICY "temp_owners_can_view_mtbs" ON public.mtbs
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Users can create MTBs" ON public.mtbs
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their MTBs" ON public.mtbs
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their MTBs" ON public.mtbs
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- 8. MTB MEMBERS TABLE
CREATE TABLE public.mtb_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mtb_id UUID NOT NULL REFERENCES public.mtbs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'expert', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mtb_id, user_id)
);

ALTER TABLE public.mtb_members ENABLE ROW LEVEL SECURITY;

-- Now drop and recreate the mtbs SELECT policy with member check
DROP POLICY "temp_owners_can_view_mtbs" ON public.mtbs;

CREATE POLICY "Users can view MTBs they own or are members of" ON public.mtbs
  FOR SELECT TO authenticated USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.mtb_members WHERE mtb_members.mtb_id = mtbs.id AND mtb_members.user_id = auth.uid())
  );

-- MTB Members policies
CREATE POLICY "Members can view MTB members" ON public.mtb_members
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.mtb_members m WHERE m.mtb_id = mtb_members.mtb_id AND m.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.mtbs WHERE mtbs.id = mtb_members.mtb_id AND mtbs.owner_id = auth.uid())
  );

CREATE POLICY "Owners can manage MTB members" ON public.mtb_members
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.mtbs WHERE mtbs.id = mtb_id AND mtbs.owner_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Owners can update MTB members" ON public.mtb_members
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.mtbs WHERE mtbs.id = mtb_members.mtb_id AND mtbs.owner_id = auth.uid())
  );

CREATE POLICY "Owners can delete MTB members" ON public.mtb_members
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.mtbs WHERE mtbs.id = mtb_members.mtb_id AND mtbs.owner_id = auth.uid())
    OR user_id = auth.uid()
  );

-- 9. MTB CASES TABLE
CREATE TABLE public.mtb_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mtb_id UUID NOT NULL REFERENCES public.mtbs(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mtb_id, case_id)
);

ALTER TABLE public.mtb_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view MTB cases" ON public.mtb_cases
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.mtb_members WHERE mtb_members.mtb_id = mtb_cases.mtb_id AND mtb_members.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.mtbs WHERE mtbs.id = mtb_cases.mtb_id AND mtbs.owner_id = auth.uid())
  );

CREATE POLICY "Members can add cases to MTB" ON public.mtb_cases
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.mtb_members WHERE mtb_members.mtb_id = mtb_id AND mtb_members.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.mtbs WHERE mtbs.id = mtb_id AND mtbs.owner_id = auth.uid())
  );

CREATE POLICY "Owners can remove cases from MTB" ON public.mtb_cases
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.mtbs WHERE mtbs.id = mtb_cases.mtb_id AND mtbs.owner_id = auth.uid())
    OR added_by = auth.uid()
  );

-- 10. INVITATIONS TABLE
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mtb_id UUID NOT NULL REFERENCES public.mtbs(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  read BOOLEAN NOT NULL DEFAULT false,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations sent to them" ON public.invitations
  FOR SELECT TO authenticated USING (
    invited_user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.email = invitations.invited_email) OR
    invited_by = auth.uid()
  );

CREATE POLICY "MTB owners can create invitations" ON public.invitations
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.mtbs WHERE mtbs.id = mtb_id AND mtbs.owner_id = auth.uid())
  );

CREATE POLICY "Invited users can update their invitations" ON public.invitations
  FOR UPDATE TO authenticated USING (
    invited_user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.email = invitations.invited_email)
  );

-- 11. MEETINGS TABLE
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mtb_id UUID NOT NULL REFERENCES public.mtbs(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'once' CHECK (schedule_type IN ('once', 'custom', 'instant')),
  repeat_days INTEGER[],
  meeting_link TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'ended', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view MTB meetings" ON public.meetings
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.mtb_members WHERE mtb_members.mtb_id = meetings.mtb_id AND mtb_members.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.mtbs WHERE mtbs.id = meetings.mtb_id AND mtbs.owner_id = auth.uid())
  );

CREATE POLICY "Members can create meetings" ON public.meetings
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.mtb_members WHERE mtb_members.mtb_id = mtb_id AND mtb_members.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.mtbs WHERE mtbs.id = mtb_id AND mtbs.owner_id = auth.uid())
  );

CREATE POLICY "Creators can update their meetings" ON public.meetings
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Creators can delete their meetings" ON public.meetings
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- 12. MEETING RESPONSES TABLE
CREATE TABLE public.meeting_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response TEXT NOT NULL DEFAULT 'pending' CHECK (response IN ('pending', 'available', 'unavailable', 'declined')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

ALTER TABLE public.meeting_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view meeting responses" ON public.meeting_responses
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.meetings m 
      JOIN public.mtb_members mm ON mm.mtb_id = m.mtb_id 
      WHERE m.id = meeting_responses.meeting_id AND mm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.meetings m 
      JOIN public.mtbs mtb ON mtb.id = m.mtb_id 
      WHERE m.id = meeting_responses.meeting_id AND mtb.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can respond to meetings" ON public.meeting_responses
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their responses" ON public.meeting_responses
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 13. MEETING NOTIFICATIONS TABLE
CREATE TABLE public.meeting_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" ON public.meeting_notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.meeting_notifications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their notifications" ON public.meeting_notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 14. GROUP MESSAGES TABLE
CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mtb_id UUID NOT NULL REFERENCES public.mtbs(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group messages" ON public.group_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.mtb_members WHERE mtb_members.mtb_id = group_messages.mtb_id AND mtb_members.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.mtbs WHERE mtbs.id = group_messages.mtb_id AND mtbs.owner_id = auth.uid())
  );

CREATE POLICY "Members can send group messages" ON public.group_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND (
      EXISTS (SELECT 1 FROM public.mtb_members WHERE mtb_members.mtb_id = mtb_id AND mtb_members.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.mtbs WHERE mtbs.id = mtb_id AND mtbs.owner_id = auth.uid())
    )
  );

-- 15. GROUP CHAT READS TABLE
CREATE TABLE public.group_chat_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mtb_id UUID NOT NULL REFERENCES public.mtbs(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, mtb_id, case_id)
);

ALTER TABLE public.group_chat_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their read status" ON public.group_chat_reads
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- 16. PRIVATE MESSAGES TABLE
CREATE TABLE public.private_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their private messages" ON public.private_messages
  FOR SELECT TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send private messages" ON public.private_messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can update read status" ON public.private_messages
  FOR UPDATE TO authenticated USING (recipient_id = auth.uid());

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mtbs_updated_at BEFORE UPDATE ON public.mtbs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_edit_tracking_updated_at BEFORE UPDATE ON public.document_edit_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TRIGGER TO CREATE PROFILE ON USER SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, avatar_url, profession, hospital_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'profession',
    NEW.raw_user_meta_data->>'hospital_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STORAGE BUCKET FOR CASE DOCUMENTS
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('case-documents', 'case-documents', false, 52428800, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);

-- Storage policies for case-documents bucket
CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'case-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'case-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'case-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'case-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================
-- ENABLE REALTIME FOR MESSAGING TABLES
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invitations;
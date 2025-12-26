-- ============================================
-- VMTB Complete Database Schema Migration
-- ============================================

-- 1. Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'expert');

-- 2. Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  profession TEXT,
  hospital_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'doctor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 4. Create cases table
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_name TEXT NOT NULL,
  cancer_type TEXT,
  clinical_summary TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(case_name, created_by)
);

-- 5. Create patients table (linked to cases)
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  anonymized_name TEXT NOT NULL,
  age INTEGER,
  sex TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image' CHECK (file_type IN ('image', 'pdf')),
  file_category TEXT,
  page_count INTEGER NOT NULL DEFAULT 1,
  storage_path TEXT,
  anonymized_file_url TEXT,
  digitized_text JSONB,
  is_anonymized BOOLEAN NOT NULL DEFAULT false,
  is_digitized BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_modified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create document_edit_tracking table
CREATE TABLE public.document_edit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  last_edited_stage TEXT NOT NULL DEFAULT 'upload' CHECK (last_edited_stage IN ('upload', 'anonymize', 'digitize')),
  requires_revisit BOOLEAN NOT NULL DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create MTBs (Molecular Tumor Boards) table
CREATE TABLE public.mtbs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  dp_image TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Create mtb_members table (junction table for MTB membership)
CREATE TABLE public.mtb_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mtb_id UUID NOT NULL REFERENCES public.mtbs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'expert', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(mtb_id, user_id)
);

-- 10. Create mtb_cases table (junction table for cases in MTBs)
CREATE TABLE public.mtb_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mtb_id UUID NOT NULL REFERENCES public.mtbs(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(mtb_id, case_id)
);

-- 11. Create invitations table
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mtb_id UUID NOT NULL REFERENCES public.mtbs(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(mtb_id, invited_email)
);

-- 12. Create meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mtb_id UUID NOT NULL REFERENCES public.mtbs(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'once' CHECK (schedule_type IN ('once', 'custom', 'instant')),
  repeat_days INTEGER[],
  meeting_link TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'ended', 'cancelled')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Create meeting_responses table (for availability/decline)
CREATE TABLE public.meeting_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response TEXT NOT NULL DEFAULT 'pending' CHECK (response IN ('pending', 'available', 'unavailable', 'declined')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

-- 14. Create meeting_notifications table
CREATE TABLE public.meeting_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  edited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  change_summary TEXT NOT NULL,
  change_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. Create group_messages table for MTB case discussions
CREATE TABLE public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mtb_id UUID NOT NULL REFERENCES public.mtbs(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Enable Row Level Security on all tables
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_edit_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mtbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mtb_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mtb_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Security Definer Functions for RLS
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is an MTB member
CREATE OR REPLACE FUNCTION public.is_mtb_member(_user_id UUID, _mtb_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mtb_members
    WHERE mtb_id = _mtb_id AND user_id = _user_id
  )
$$;

-- Function to check if user owns the MTB
CREATE OR REPLACE FUNCTION public.is_mtb_owner(_user_id UUID, _mtb_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mtbs
    WHERE id = _mtb_id AND owner_id = _user_id
  )
$$;

-- ============================================
-- RLS Policies
-- ============================================

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles policies (only admins can modify, all can view own)
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Cases policies
CREATE POLICY "Users can view own cases" ON public.cases
  FOR SELECT TO authenticated USING (created_by = auth.uid());

CREATE POLICY "MTB members can view shared cases" ON public.cases
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.mtb_cases mc
      JOIN public.mtb_members mm ON mc.mtb_id = mm.mtb_id
      WHERE mc.case_id = cases.id AND mm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own cases" ON public.cases
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own cases" ON public.cases
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Users can delete own cases" ON public.cases
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Patients policies
CREATE POLICY "Users can view patients of own cases" ON public.patients
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.cases WHERE id = case_id AND created_by = auth.uid())
  );

CREATE POLICY "MTB members can view shared patients" ON public.patients
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.mtb_cases mc
      JOIN public.mtb_members mm ON mc.mtb_id = mm.mtb_id
      WHERE mc.case_id = patients.case_id AND mm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert patients for own cases" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.cases WHERE id = case_id AND created_by = auth.uid())
  );

CREATE POLICY "Users can update patients of own cases" ON public.patients
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.cases WHERE id = case_id AND created_by = auth.uid())
  );

-- Documents policies
CREATE POLICY "Users can view documents of own cases" ON public.documents
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.cases WHERE id = case_id AND created_by = auth.uid())
  );

CREATE POLICY "MTB members can view shared documents" ON public.documents
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.mtb_cases mc
      JOIN public.mtb_members mm ON mc.mtb_id = mm.mtb_id
      WHERE mc.case_id = documents.case_id AND mm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents for own cases" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.cases WHERE id = case_id AND created_by = auth.uid())
  );

CREATE POLICY "Users can update documents of own cases" ON public.documents
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.cases WHERE id = case_id AND created_by = auth.uid())
  );

CREATE POLICY "Users can delete documents of own cases" ON public.documents
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.cases WHERE id = case_id AND created_by = auth.uid())
  );

-- Document edit tracking policies
CREATE POLICY "Users can manage tracking for own docs" ON public.document_edit_tracking
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.cases c ON d.case_id = c.id
      WHERE d.id = document_id AND c.created_by = auth.uid()
    )
  );

-- MTBs policies
CREATE POLICY "Users can view owned MTBs" ON public.mtbs
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Members can view joined MTBs" ON public.mtbs
  FOR SELECT TO authenticated USING (public.is_mtb_member(auth.uid(), id));

CREATE POLICY "Users can create MTBs" ON public.mtbs
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update MTBs" ON public.mtbs
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete MTBs" ON public.mtbs
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- MTB members policies
CREATE POLICY "MTB members can view memberships" ON public.mtb_members
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.is_mtb_owner(auth.uid(), mtb_id)
  );

CREATE POLICY "MTB owners can manage members" ON public.mtb_members
  FOR ALL TO authenticated USING (public.is_mtb_owner(auth.uid(), mtb_id));

CREATE POLICY "Users can insert own membership" ON public.mtb_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- MTB cases policies
CREATE POLICY "MTB members can view MTB cases" ON public.mtb_cases
  FOR SELECT TO authenticated USING (public.is_mtb_member(auth.uid(), mtb_id));

CREATE POLICY "MTB owners can manage cases" ON public.mtb_cases
  FOR ALL TO authenticated USING (public.is_mtb_owner(auth.uid(), mtb_id));

CREATE POLICY "Case owners can add to MTBs they're in" ON public.mtb_cases
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.cases WHERE id = case_id AND created_by = auth.uid())
    AND public.is_mtb_member(auth.uid(), mtb_id)
  );

-- Invitations policies
CREATE POLICY "Users can view own invitations" ON public.invitations
  FOR SELECT TO authenticated USING (
    invited_user_id = auth.uid() OR invited_by = auth.uid()
  );

CREATE POLICY "Users can view invitations by email" ON public.invitations
  FOR SELECT TO authenticated USING (
    invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "MTB owners can create invitations" ON public.invitations
  FOR INSERT TO authenticated WITH CHECK (public.is_mtb_owner(auth.uid(), mtb_id));

CREATE POLICY "Invited users can update invitations" ON public.invitations
  FOR UPDATE TO authenticated USING (
    invited_user_id = auth.uid() 
    OR invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- Meetings policies
CREATE POLICY "MTB members can view meetings" ON public.meetings
  FOR SELECT TO authenticated USING (public.is_mtb_member(auth.uid(), mtb_id));

CREATE POLICY "MTB owners can create meetings" ON public.meetings
  FOR INSERT TO authenticated WITH CHECK (public.is_mtb_owner(auth.uid(), mtb_id));

CREATE POLICY "Creators can update meetings" ON public.meetings
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Creators can delete meetings" ON public.meetings
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Meeting responses policies
CREATE POLICY "Responders can manage own responses" ON public.meeting_responses
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Meeting participants can view responses" ON public.meeting_responses
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_id AND public.is_mtb_member(auth.uid(), m.mtb_id)
    )
  );

-- Meeting notifications policies
CREATE POLICY "Users can manage own notifications" ON public.meeting_notifications
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- Audit logs policies (read only for owners)
CREATE POLICY "Case owners can view case audits" ON public.audit_logs
  FOR SELECT TO authenticated USING (
    entity_type = 'case' AND EXISTS (
      SELECT 1 FROM public.cases WHERE id = entity_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert own audits" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (edited_by = auth.uid());

-- Group messages policies
CREATE POLICY "MTB members can view messages" ON public.group_messages
  FOR SELECT TO authenticated USING (public.is_mtb_member(auth.uid(), mtb_id));

CREATE POLICY "MTB members can send messages" ON public.group_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND public.is_mtb_member(auth.uid(), mtb_id)
  );

-- ============================================
-- Triggers for automatic timestamps
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mtbs_updated_at
  BEFORE UPDATE ON public.mtbs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_tracking_updated_at
  BEFORE UPDATE ON public.document_edit_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_responses_updated_at
  BEFORE UPDATE ON public.meeting_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Profile creation trigger on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, avatar_url, profession, hospital_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'profession',
    NEW.raw_user_meta_data ->> 'hospital_name'
  );
  
  -- Assign default doctor role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'doctor');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Create indexes for performance
-- ============================================

CREATE INDEX idx_cases_created_by ON public.cases(created_by);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_patients_case_id ON public.patients(case_id);
CREATE INDEX idx_documents_case_id ON public.documents(case_id);
CREATE INDEX idx_mtb_members_mtb_id ON public.mtb_members(mtb_id);
CREATE INDEX idx_mtb_members_user_id ON public.mtb_members(user_id);
CREATE INDEX idx_mtb_cases_mtb_id ON public.mtb_cases(mtb_id);
CREATE INDEX idx_mtb_cases_case_id ON public.mtb_cases(case_id);
CREATE INDEX idx_invitations_invited_email ON public.invitations(invited_email);
CREATE INDEX idx_invitations_mtb_id ON public.invitations(mtb_id);
CREATE INDEX idx_meetings_mtb_id ON public.meetings(mtb_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_group_messages_mtb_id ON public.group_messages(mtb_id);
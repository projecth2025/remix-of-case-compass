
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Trigger for new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  sex TEXT,
  cancer_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own patients" ON public.patients
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create cases table
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'Pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cases" ON public.cases
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create uploaded_files table
CREATE TABLE public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  size INTEGER,
  type TEXT,
  file_category TEXT,
  storage_path TEXT,
  extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own files" ON public.uploaded_files
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create MTBs table
CREATE TABLE public.mtbs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  display_picture TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.mtbs ENABLE ROW LEVEL SECURITY;

-- Create mtb_members table
CREATE TABLE public.mtb_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mtb_id UUID REFERENCES public.mtbs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(mtb_id, user_id)
);

ALTER TABLE public.mtb_members ENABLE ROW LEVEL SECURITY;

-- Create mtb_cases junction table
CREATE TABLE public.mtb_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mtb_id UUID REFERENCES public.mtbs(id) ON DELETE CASCADE NOT NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(mtb_id, case_id)
);

ALTER TABLE public.mtb_cases ENABLE ROW LEVEL SECURITY;

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_group_message BOOLEAN DEFAULT false NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check MTB membership (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_mtb_member(_user_id UUID, _mtb_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mtb_members
    WHERE user_id = _user_id AND mtb_id = _mtb_id
  ) OR EXISTS (
    SELECT 1 FROM public.mtbs
    WHERE id = _mtb_id AND owner_id = _user_id
  )
$$;

-- MTBs policies using helper function
CREATE POLICY "Users can view own or member MTBs" ON public.mtbs
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_mtb_member(auth.uid(), id));

CREATE POLICY "Users can create MTBs" ON public.mtbs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update MTBs" ON public.mtbs
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete MTBs" ON public.mtbs
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- MTB members policies
CREATE POLICY "Members can view MTB members" ON public.mtb_members
  FOR SELECT TO authenticated
  USING (public.is_mtb_member(auth.uid(), mtb_id));

CREATE POLICY "Owners can manage MTB members" ON public.mtb_members
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mtbs WHERE id = mtb_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mtbs WHERE id = mtb_id AND owner_id = auth.uid()));

-- MTB cases policies
CREATE POLICY "Members can view MTB cases" ON public.mtb_cases
  FOR SELECT TO authenticated
  USING (public.is_mtb_member(auth.uid(), mtb_id));

CREATE POLICY "Owners can manage MTB cases" ON public.mtb_cases
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mtbs WHERE id = mtb_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mtbs WHERE id = mtb_id AND owner_id = auth.uid()));

-- Chat messages policies
CREATE POLICY "Users can view relevant messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid() OR 
    recipient_id = auth.uid() OR 
    (is_group_message = true AND EXISTS (
      SELECT 1 FROM public.mtb_cases mc
      JOIN public.mtb_members mm ON mc.mtb_id = mm.mtb_id
      WHERE mc.case_id = chat_messages.case_id AND mm.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can send messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- Update invitations table to use UUID references
ALTER TABLE public.invitations 
  ALTER COLUMN invited_by_id TYPE UUID USING invited_by_id::UUID,
  ALTER COLUMN mtb_id TYPE UUID USING mtb_id::UUID;

-- Add foreign key constraints to invitations
ALTER TABLE public.invitations
  ADD CONSTRAINT fk_invitations_invited_by FOREIGN KEY (invited_by_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_invitations_mtb FOREIGN KEY (mtb_id) REFERENCES public.mtbs(id) ON DELETE CASCADE;

-- Update timestamp trigger
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

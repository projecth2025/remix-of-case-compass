-- Create table to track when users last read group chats
CREATE TABLE public.group_chat_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mtb_id UUID NOT NULL REFERENCES public.mtbs(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, mtb_id, case_id)
);

-- Enable RLS
ALTER TABLE public.group_chat_reads ENABLE ROW LEVEL SECURITY;

-- Users can manage their own read status
CREATE POLICY "Users can manage own read status"
ON public.group_chat_reads FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create index for performance
CREATE INDEX idx_group_chat_reads_user ON public.group_chat_reads(user_id);
CREATE INDEX idx_group_chat_reads_mtb ON public.group_chat_reads(mtb_id, case_id);
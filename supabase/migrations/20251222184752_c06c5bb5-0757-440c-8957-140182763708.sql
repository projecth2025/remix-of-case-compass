-- Create meetings table
CREATE TABLE public.meetings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    mtb_id UUID NOT NULL REFERENCES public.mtbs(id) ON DELETE CASCADE,
    created_by UUID NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    schedule_type TEXT NOT NULL DEFAULT 'once',
    repeat_days INTEGER[] DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting notifications table
CREATE TABLE public.meeting_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_notifications ENABLE ROW LEVEL SECURITY;

-- Meetings policies
-- MTB members can view meetings for their MTBs
CREATE POLICY "Members can view MTB meetings" 
ON public.meetings 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM mtbs 
        WHERE mtbs.id = meetings.mtb_id 
        AND (mtbs.owner_id = auth.uid() OR is_mtb_member(auth.uid(), mtbs.id))
    )
);

-- MTB owners can create meetings
CREATE POLICY "Owners can create meetings" 
ON public.meetings 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM mtbs 
        WHERE mtbs.id = meetings.mtb_id 
        AND mtbs.owner_id = auth.uid()
    )
);

-- MTB owners can update their meetings
CREATE POLICY "Owners can update meetings" 
ON public.meetings 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM mtbs 
        WHERE mtbs.id = meetings.mtb_id 
        AND mtbs.owner_id = auth.uid()
    )
);

-- MTB owners can delete their meetings
CREATE POLICY "Owners can delete meetings" 
ON public.meetings 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM mtbs 
        WHERE mtbs.id = meetings.mtb_id 
        AND mtbs.owner_id = auth.uid()
    )
);

-- Meeting notifications policies
-- Users can view their own notifications
CREATE POLICY "Users can view own meeting notifications" 
ON public.meeting_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- MTB owners can create notifications for members
CREATE POLICY "Owners can create meeting notifications" 
ON public.meeting_notifications 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM meetings m
        JOIN mtbs ON mtbs.id = m.mtb_id
        WHERE m.id = meeting_notifications.meeting_id 
        AND mtbs.owner_id = auth.uid()
    )
);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own meeting notifications" 
ON public.meeting_notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Owners can delete notifications for their meetings
CREATE POLICY "Owners can delete meeting notifications" 
ON public.meeting_notifications 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM meetings m
        JOIN mtbs ON mtbs.id = m.mtb_id
        WHERE m.id = meeting_notifications.meeting_id 
        AND mtbs.owner_id = auth.uid()
    )
);

-- Create indexes for performance
CREATE INDEX idx_meetings_mtb_id ON public.meetings(mtb_id);
CREATE INDEX idx_meetings_created_by ON public.meetings(created_by);
CREATE INDEX idx_meeting_notifications_user_id ON public.meeting_notifications(user_id);
CREATE INDEX idx_meeting_notifications_meeting_id ON public.meeting_notifications(meeting_id);
CREATE INDEX idx_meeting_notifications_read ON public.meeting_notifications(read);
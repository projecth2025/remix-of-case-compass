import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Meeting {
  id: string;
  mtbId: string;
  mtbName: string;
  createdBy: string;
  title: string | null;
  scheduledDate: string;
  scheduledTime: string;
  scheduleType: 'once' | 'custom' | 'instant';
  repeatDays: number[] | null;
  meetingLink: string | null;
  status: 'scheduled' | 'in_progress' | 'ended' | 'cancelled';
  startedAt: string | null;
  createdAt: string;
}

export interface MeetingResponse {
  id: string;
  meetingId: string;
  userId: string;
  userName: string;
  response: 'pending' | 'available' | 'unavailable' | 'declined';
  comment: string | null;
}

export function useMeetings() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchMeetings = useCallback(async () => {
    if (!user) {
      setMeetings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get MTB IDs where user is a member
      const { data: memberships } = await supabase
        .from('mtb_members')
        .select('mtb_id')
        .eq('user_id', user.id);

      const mtbIds = (memberships || []).map(m => m.mtb_id);

      if (mtbIds.length === 0) {
        setMeetings([]);
        setLoading(false);
        return;
      }

      // Fetch meetings for those MTBs
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          mtb:mtbs(name)
        `)
        .in('mtb_id', mtbIds)
        .neq('status', 'ended')
        .neq('status', 'cancelled')
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map(m => ({
        id: m.id,
        mtbId: m.mtb_id,
        mtbName: (m.mtb as any)?.name || 'Unknown MTB',
        createdBy: m.created_by,
        title: m.title,
        scheduledDate: m.scheduled_date,
        scheduledTime: m.scheduled_time,
        scheduleType: m.schedule_type as 'once' | 'custom' | 'instant',
        repeatDays: m.repeat_days,
        meetingLink: m.meeting_link,
        status: m.status as 'scheduled' | 'in_progress' | 'ended' | 'cancelled',
        startedAt: m.started_at,
        createdAt: m.created_at,
      }));

      setMeetings(mapped);
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createMeeting = async (
    mtbId: string,
    scheduledDate: Date,
    scheduledTime: string,
    scheduleType: 'once' | 'custom' | 'instant',
    repeatDays: number[] | null,
    title?: string
  ): Promise<Meeting | null> => {
    if (!user) {
      toast.error('You must be logged in');
      return null;
    }

    try {
      const dateStr = scheduledDate.toISOString().split('T')[0];
      let meetingLink: string | null = null;
      let status: 'scheduled' | 'in_progress' = 'scheduled';
      let startedAt: string | null = null;

      if (scheduleType === 'instant') {
        meetingLink = `https://meet.google.com/new?instant=${Date.now()}`;
        status = 'in_progress';
        startedAt = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('meetings')
        .insert({
          mtb_id: mtbId,
          created_by: user.id,
          title: title || null,
          scheduled_date: dateStr,
          scheduled_time: scheduledTime,
          schedule_type: scheduleType,
          repeat_days: repeatDays,
          meeting_link: meetingLink,
          status,
          started_at: startedAt,
        })
        .select(`*, mtb:mtbs(name)`)
        .single();

      if (error) throw error;

      // Get MTB members to create notifications
      const { data: members } = await supabase
        .from('mtb_members')
        .select('user_id')
        .eq('mtb_id', mtbId);

      if (members && members.length > 0) {
        await supabase
          .from('meeting_notifications')
          .insert(
            members.map(m => ({
              meeting_id: data.id,
              user_id: m.user_id,
            }))
          );
      }

      const meeting: Meeting = {
        id: data.id,
        mtbId: data.mtb_id,
        mtbName: (data.mtb as any)?.name || '',
        createdBy: data.created_by,
        title: data.title,
        scheduledDate: data.scheduled_date,
        scheduledTime: data.scheduled_time,
        scheduleType: data.schedule_type as 'once' | 'custom' | 'instant',
        repeatDays: data.repeat_days,
        meetingLink: data.meeting_link,
        status: data.status as 'scheduled' | 'in_progress',
        startedAt: data.started_at,
        createdAt: data.created_at,
      };

      if (scheduleType === 'instant' && meetingLink) {
        window.open(meetingLink, '_blank');
        toast.success('Instant meeting started');
      } else {
        toast.success('Meeting scheduled');
      }

      await fetchMeetings();
      return meeting;
    } catch (err) {
      console.error('Error creating meeting:', err);
      toast.error('Failed to schedule meeting');
      return null;
    }
  };

  const deleteMeeting = async (meetingId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId)
        .eq('created_by', user.id);

      if (error) throw error;

      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      toast.success('Meeting cancelled');
      return true;
    } catch (err) {
      console.error('Error deleting meeting:', err);
      toast.error('Failed to cancel meeting');
      return false;
    }
  };

  const joinMeeting = (meeting: Meeting): string | null => {
    if (!user) return null;

    // Generate a fresh meeting link
    const meetingLink = `https://meet.google.com/new?mid=${meeting.id}&t=${Date.now()}`;
    window.open(meetingLink, '_blank');
    return meetingLink;
  };

  const endMeeting = async (meetingId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('meetings')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', meetingId)
        .eq('created_by', user.id);

      if (error) throw error;

      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      toast.success('Meeting ended');
      return true;
    } catch (err) {
      console.error('Error ending meeting:', err);
      toast.error('Failed to end meeting');
      return false;
    }
  };

  const getMeetingsForMTB = useCallback(
    (mtbId: string): Meeting[] => {
      return meetings.filter(m => m.mtbId === mtbId);
    },
    [meetings]
  );

  const getUpcomingMeetingForMTB = useCallback(
    (mtbId: string): Meeting | null => {
      const mtbMeetings = getMeetingsForMTB(mtbId);
      return mtbMeetings[0] || null;
    },
    [getMeetingsForMTB]
  );

  const respondToMeeting = async (
    meetingId: string,
    response: 'available' | 'unavailable' | 'declined',
    comment?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('meeting_responses')
        .upsert({
          meeting_id: meetingId,
          user_id: user.id,
          response,
          comment: comment || null,
        });

      if (error) throw error;

      toast.success('Response recorded');
      return true;
    } catch (err) {
      console.error('Error responding to meeting:', err);
      toast.error('Failed to record response');
      return false;
    }
  };

  const getMeetingResponses = async (meetingId: string): Promise<MeetingResponse[]> => {
    try {
      const { data, error } = await supabase
        .from('meeting_responses')
        .select(`
          *,
          user:profiles!meeting_responses_user_id_fkey(name)
        `)
        .eq('meeting_id', meetingId);

      if (error) throw error;

      return (data || []).map(r => ({
        id: r.id,
        meetingId: r.meeting_id,
        userId: r.user_id,
        userName: (r.user as any)?.name || 'Unknown',
        response: r.response as 'pending' | 'available' | 'unavailable' | 'declined',
        comment: r.comment,
      }));
    } catch (err) {
      console.error('Error fetching responses:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Mark notifications as read
  const markNotificationsRead = async () => {
    // Notifications are handled via the meeting_notifications table
    // For now this is a no-op as we track via meetings directly
  };

  return {
    meetings,
    loading,
    unreadCount,
    notifications: [], // Kept for backward compat
    fetchMeetings,
    createMeeting,
    deleteMeeting,
    joinMeeting,
    endMeeting,
    getMeetingsForMTB,
    getUpcomingMeetingForMTB,
    respondToMeeting,
    getMeetingResponses,
    markNotificationsRead,
    refetch: fetchMeetings,
  };
}

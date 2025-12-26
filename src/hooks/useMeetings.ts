import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Meeting, MeetingNotification, generateId } from '@/lib/storage';
import { toast } from 'sonner';
import { toLocalDateString, getUpcomingMeetingsSorted } from '@/lib/meetingUtils';

const MEETINGS_KEY = 'vmtb_meetings';
const NOTIFICATIONS_KEY = 'vmtb_meeting_notifications';

const loadMeetings = (): Meeting[] => {
  try {
    const stored = localStorage.getItem(MEETINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveMeetings = (meetings: Meeting[]) => {
  localStorage.setItem(MEETINGS_KEY, JSON.stringify(meetings));
  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('meetings-updated'));
};

const loadNotifications = (): MeetingNotification[] => {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveNotifications = (notifications: MeetingNotification[]) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

export const useMeetings = () => {
  const { user } = useAuth();
  const { state } = useApp();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notifications, setNotifications] = useState<MeetingNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get MTB IDs where the current user is a member or owner
  const getUserMtbIds = useCallback((): string[] => {
    if (!user) return [];
    
    // Get all MTBs the user has access to (owner or member)
    const userMtbIds = state.mtbs.map(mtb => mtb.id);
    
    return userMtbIds;
  }, [user, state.mtbs]);

  const fetchMeetings = useCallback(() => {
    if (!user) return;
    
    setLoading(true);
    try {
      const allMeetings = loadMeetings();
      const userMtbIds = getUserMtbIds();
      
      // Filter meetings to only include those from MTBs the user is part of
      // and exclude ended meetings
      const userMeetings = allMeetings.filter(m => 
        userMtbIds.includes(m.mtb_id) && m.status !== 'ended'
      );
      
      // Sort chronologically
      const sortedMeetings = getUpcomingMeetingsSorted(userMeetings);
      
      setMeetings(sortedMeetings);
    } finally {
      setLoading(false);
    }
  }, [user, getUserMtbIds]);

  const fetchNotifications = useCallback(() => {
    if (!user) return;

    try {
      const allNotifications = loadNotifications();
      // Filter notifications for current user and attach meeting data
      const userNotifications = allNotifications
        .filter(n => n.user_id === user.id)
        .map(n => ({
          ...n,
          meeting: loadMeetings().find(m => m.id === n.meeting_id),
        }));

      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  const createMeeting = useCallback(async (
    mtbId: string,
    mtbName: string,
    scheduledDate: Date,
    scheduledTime: string,
    scheduleType: 'once' | 'custom' | 'instant',
    repeatDays: number[] | null,
    explicitDates?: Date[] // Additional explicit dates for when both recurrence and dates are selected
  ) => {
    if (!user) return null;

    try {
      const allMeetings = loadMeetings();
      const createdMeetings: Meeting[] = [];
      
      // Use local date components to prevent timezone shifting
      const localDateStr = toLocalDateString(scheduledDate);
      
      // Handle instant meeting
      if (scheduleType === 'instant') {
        const meetingLink = `https://meet.google.com/new?instant=${generateId()}`;
        const newMeeting: Meeting = {
          id: generateId(),
          mtb_id: mtbId,
          mtb_name: mtbName,
          created_by: user.id,
          scheduled_date: localDateStr,
          scheduled_time: scheduledTime,
          schedule_type: 'instant',
          repeat_days: null,
          created_at: new Date().toISOString(),
          status: 'in_progress',
          started_at: new Date().toISOString(),
          meeting_link: meetingLink,
        };
        
        allMeetings.push(newMeeting);
        createdMeetings.push(newMeeting);
        
        // Open the meeting immediately
        window.open(meetingLink, '_blank');
        toast.success('Instant meeting started');
      } else if (scheduleType === 'custom' && repeatDays && repeatDays.length > 0) {
        // Create recurring meeting entry
        const recurringMeeting: Meeting = {
          id: generateId(),
          mtb_id: mtbId,
          mtb_name: mtbName,
          created_by: user.id,
          scheduled_date: localDateStr,
          scheduled_time: scheduledTime,
          schedule_type: 'custom',
          repeat_days: repeatDays,
          created_at: new Date().toISOString(),
          status: 'scheduled',
          is_recurring_instance: true,
        };
        
        allMeetings.push(recurringMeeting);
        createdMeetings.push(recurringMeeting);
        
        // If there are also explicit dates, create separate one-time meetings for them
        if (explicitDates && explicitDates.length > 0) {
          for (const date of explicitDates) {
            const dateStr = toLocalDateString(date);
            const explicitMeeting: Meeting = {
              id: generateId(),
              mtb_id: mtbId,
              mtb_name: mtbName,
              created_by: user.id,
              scheduled_date: dateStr,
              scheduled_time: scheduledTime,
              schedule_type: 'once',
              repeat_days: null,
              created_at: new Date().toISOString(),
              status: 'scheduled',
            };
            
            allMeetings.push(explicitMeeting);
            createdMeetings.push(explicitMeeting);
          }
        }
        
        toast.success('Meeting(s) scheduled successfully');
      } else {
        // One-time meeting
        const newMeeting: Meeting = {
          id: generateId(),
          mtb_id: mtbId,
          mtb_name: mtbName,
          created_by: user.id,
          scheduled_date: localDateStr,
          scheduled_time: scheduledTime,
          schedule_type: 'once',
          repeat_days: null,
          created_at: new Date().toISOString(),
          status: 'scheduled',
        };
        
        allMeetings.push(newMeeting);
        createdMeetings.push(newMeeting);
        toast.success('Meeting scheduled successfully');
      }
      
      saveMeetings(allMeetings);
      
      // Update local state immediately
      setMeetings(prev => getUpcomingMeetingsSorted([...prev, ...createdMeetings]));
      
      return createdMeetings[0];
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error('Failed to schedule meeting');
      return null;
    }
  }, [user]);

  // Delete a meeting
  const deleteMeeting = useCallback(async (meetingId: string) => {
    if (!user) return false;

    try {
      const allMeetings = loadMeetings();
      const updatedMeetings = allMeetings.filter(m => m.id !== meetingId);
      saveMeetings(updatedMeetings);
      
      // Update local state immediately
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      
      toast.success('Meeting cancelled successfully');
      return true;
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error('Failed to cancel meeting');
      return false;
    }
  }, [user]);

  // Join a meeting - always creates a new meeting link (per user requirement)
  const joinMeeting = useCallback((meeting: Meeting): string | null => {
    if (!user) return null;

    try {
      // Always generate a fresh meeting link
      const meetingLink = `https://meet.google.com/new?mid=${meeting.id}&t=${Date.now()}`;
      
      window.open(meetingLink, '_blank');
      
      return meetingLink;
    } catch (error) {
      console.error('Error joining meeting:', error);
      toast.error('Failed to join meeting');
      return null;
    }
  }, [user]);

  // End a meeting - marks it as ended so it disappears from lists
  const endMeeting = useCallback(async (meetingId: string) => {
    if (!user) return false;

    try {
      const allMeetings = loadMeetings();
      const meetingIndex = allMeetings.findIndex(m => m.id === meetingId);
      
      if (meetingIndex === -1) return false;
      
      allMeetings[meetingIndex] = {
        ...allMeetings[meetingIndex],
        status: 'ended',
      };
      
      saveMeetings(allMeetings);
      
      // Update local state immediately
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      
      toast.success('Meeting ended');
      return true;
    } catch (error) {
      console.error('Error ending meeting:', error);
      toast.error('Failed to end meeting');
      return false;
    }
  }, [user]);

  // Get meetings for a specific MTB - reads fresh from localStorage and sorts
  const getMeetingsForMTB = useCallback((mtbId: string): Meeting[] => {
    const allMeetings = loadMeetings();
    const mtbMeetings = allMeetings.filter(m => m.mtb_id === mtbId && m.status !== 'ended');
    return getUpcomingMeetingsSorted(mtbMeetings);
  }, []);

  // Get earliest upcoming meeting for a specific MTB
  const getUpcomingMeetingForMTB = useCallback((mtbId: string): Meeting | null => {
    const mtbMeetings = getMeetingsForMTB(mtbId);
    return mtbMeetings[0] || null;
  }, [getMeetingsForMTB]);

  const markNotificationsRead = async () => {
    if (!user || notifications.length === 0) return;

    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      const allNotifications = loadNotifications();
      const updatedNotifications = allNotifications.map(n => 
        unreadIds.includes(n.id) ? { ...n, read: true } : n
      );
      saveNotifications(updatedNotifications);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Listen for meetings updates from other components
  useEffect(() => {
    const handleMeetingsUpdate = () => {
      fetchMeetings();
    };

    window.addEventListener('meetings-updated', handleMeetingsUpdate);
    return () => {
      window.removeEventListener('meetings-updated', handleMeetingsUpdate);
    };
  }, [fetchMeetings]);

  useEffect(() => {
    if (user) {
      fetchMeetings();
      fetchNotifications();
    }
  }, [user, fetchMeetings, fetchNotifications]);

  return {
    meetings,
    notifications,
    loading,
    unreadCount,
    createMeeting,
    deleteMeeting,
    joinMeeting,
    endMeeting,
    markNotificationsRead,
    getMeetingsForMTB,
    getUpcomingMeetingForMTB,
    refetch: () => {
      fetchMeetings();
      fetchNotifications();
    },
  };
};

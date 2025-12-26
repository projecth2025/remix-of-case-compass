import { format, parseISO, isToday, isTomorrow, differenceInMinutes, isAfter, startOfToday } from 'date-fns';
import type { Meeting } from '@/lib/storage';

/**
 * Format a 24-hour time string (HH:mm) to 12-hour format with AM/PM
 */
export const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return format(date, 'h:mm a');
};

/**
 * Format meeting date for display
 */
export const formatMeetingDateDisplay = (dateStr: string): string => {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, MMM d, yyyy');
};

/**
 * Format meeting date short (for lists)
 */
export const formatMeetingDateShort = (dateStr: string): string => {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, d MMM');
};

/**
 * Check if Join button should be enabled
 * For recurring meetings: check if current day matches and time is within range
 * For one-time meetings: 5 minutes before meeting, up to 60 min after start
 */
export const isJoinEnabled = (meeting: Meeting): boolean => {
  const now = new Date();
  
  // For recurring meetings, check if today is one of the repeat days and time is appropriate
  if (meeting.schedule_type === 'custom' && meeting.repeat_days && meeting.repeat_days.length > 0) {
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    if (!meeting.repeat_days.includes(currentDayOfWeek)) {
      return false; // Not a meeting day
    }
    
    // Check if current time is within the meeting window
    const [hours, minutes] = meeting.scheduled_time.split(':').map(Number);
    const meetingToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
    const minutesUntilMeeting = differenceInMinutes(meetingToday, now);
    return minutesUntilMeeting <= 5 && minutesUntilMeeting >= -60;
  }
  
  // For one-time meetings
  const [year, month, day] = meeting.scheduled_date.split('-').map(Number);
  const [hours, minutes] = meeting.scheduled_time.split(':').map(Number);
  
  // Create date in local timezone
  const meetingDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
  
  const minutesUntilMeeting = differenceInMinutes(meetingDateTime, now);
  // Enable 5 min before, disable 60 min after start
  return minutesUntilMeeting <= 5 && minutesUntilMeeting >= -60;
};

/**
 * Create a date string (YYYY-MM-DD) from a Date object in local timezone
 * This prevents timezone shifting issues
 */
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse a date string (YYYY-MM-DD) to Date in local timezone
 */
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Get meeting datetime for sorting
 */
export const getMeetingDateTime = (meeting: Meeting): Date => {
  const [year, month, day] = meeting.scheduled_date.split('-').map(Number);
  const [hours, minutes] = meeting.scheduled_time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

/**
 * Sort meetings chronologically (earliest first)
 */
export const sortMeetingsChronologically = (meetings: Meeting[]): Meeting[] => {
  return [...meetings].sort((a, b) => {
    const dateA = getMeetingDateTime(a);
    const dateB = getMeetingDateTime(b);
    return dateA.getTime() - dateB.getTime();
  });
};

/**
 * Filter and sort upcoming meetings (today and future)
 * Recurring meetings are always considered upcoming
 */
export const getUpcomingMeetingsSorted = (meetings: Meeting[]): Meeting[] => {
  const now = new Date();
  const todayStart = startOfToday();
  
  return meetings
    .filter(m => {
      // Recurring meetings are always considered upcoming
      if (m.schedule_type === 'custom' && m.repeat_days && m.repeat_days.length > 0) {
        return true;
      }
      
      const meetingDate = parseLocalDate(m.scheduled_date);
      const meetingDateTime = getMeetingDateTime(m);
      // Include if meeting date is today or later, and meeting hasn't ended (60 min grace)
      const isUpcoming = isAfter(meetingDate, todayStart) || format(meetingDate, 'yyyy-MM-dd') === format(todayStart, 'yyyy-MM-dd');
      const minutesSinceStart = differenceInMinutes(now, meetingDateTime);
      const hasEnded = minutesSinceStart > 60; // Meeting considered ended 60 min after start
      return isUpcoming && !hasEnded;
    })
    .sort((a, b) => {
      // Put recurring meetings at the end (or sort by created_at)
      const aIsRecurring = a.schedule_type === 'custom' && a.repeat_days && a.repeat_days.length > 0;
      const bIsRecurring = b.schedule_type === 'custom' && b.repeat_days && b.repeat_days.length > 0;
      
      // Non-recurring meetings sorted by datetime
      if (!aIsRecurring && !bIsRecurring) {
        const dateA = getMeetingDateTime(a);
        const dateB = getMeetingDateTime(b);
        return dateA.getTime() - dateB.getTime();
      }
      
      // Recurring meetings come after specific-date meetings
      if (aIsRecurring && !bIsRecurring) return 1;
      if (!aIsRecurring && bIsRecurring) return -1;
      
      // Both recurring - sort by creation date
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
};

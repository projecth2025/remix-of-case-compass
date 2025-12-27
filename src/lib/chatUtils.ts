import { format, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Format a timestamp for display inside message bubbles (e.g., "5:28 PM")
 */
export const formatMessageTime = (timestamp: string): string => {
  const date = parseISO(timestamp);
  return format(date, 'h:mm a');
};

/**
 * Format a date for the date separator (e.g., "27 December 2025")
 */
export const formatDateSeparator = (timestamp: string): string => {
  const date = parseISO(timestamp);
  
  if (isToday(date)) {
    return 'Today';
  }
  
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  
  return format(date, 'd MMMM yyyy');
};

/**
 * Check if two timestamps are on different days
 */
export const isDifferentDay = (timestamp1: string, timestamp2: string): boolean => {
  const date1 = parseISO(timestamp1);
  const date2 = parseISO(timestamp2);
  
  return (
    date1.getFullYear() !== date2.getFullYear() ||
    date1.getMonth() !== date2.getMonth() ||
    date1.getDate() !== date2.getDate()
  );
};

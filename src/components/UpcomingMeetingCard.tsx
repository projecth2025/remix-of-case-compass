import { Calendar, Clock } from 'lucide-react';
import { useMeetings } from '@/hooks/useMeetings';
import { format, parseISO, isAfter, startOfToday } from 'date-fns';

interface UpcomingMeetingCardProps {
  onShowMore: () => void;
}

const UpcomingMeetingCard = ({ onShowMore }: UpcomingMeetingCardProps) => {
  const { meetings } = useMeetings();

  // Get the nearest upcoming meeting
  const today = startOfToday();
  const upcomingMeetings = meetings
    .filter((m) => {
      const meetingDate = parseISO(m.scheduled_date);
      return isAfter(meetingDate, today) || format(meetingDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.scheduled_date}T${a.scheduled_time}`);
      const dateB = new Date(`${b.scheduled_date}T${b.scheduled_time}`);
      return dateA.getTime() - dateB.getTime();
    });

  const nearestMeeting = upcomingMeetings[0];

  const formatMeetingDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const formatMeetingTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Discussion</h3>
      
      {nearestMeeting ? (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h4 className="font-semibold text-foreground text-base mb-3">
            {nearestMeeting.mtb_name || 'MTB Meeting'}
          </h4>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Calendar className="w-4 h-4" />
            <span>{formatMeetingDate(nearestMeeting.scheduled_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="w-4 h-4" />
            <span>{formatMeetingTime(nearestMeeting.scheduled_time)}</span>
          </div>
        </div>
      ) : (
        <div className="bg-muted/50 border border-border rounded-xl p-5 text-center">
          <p className="text-muted-foreground text-sm">No upcoming meetings scheduled</p>
        </div>
      )}

      <button
        type="button"
        onClick={onShowMore}
        className="mt-4 text-primary hover:underline text-sm font-medium"
      >
        Show more
      </button>
    </div>
  );
};

export default UpcomingMeetingCard;

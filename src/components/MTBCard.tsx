import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { MTB } from '@/lib/storage';
import { useMeetings } from '@/hooks/useMeetings';
import { format, parseISO } from 'date-fns';

interface MTBCardProps {
  mtb: MTB;
  isDragging?: boolean;
  expertCount?: number;
  caseCount?: number;
}

const MTBCard = ({ mtb, isDragging, expertCount = 0, caseCount = 0 }: MTBCardProps) => {
  const navigate = useNavigate();
  const { getUpcomingMeetingForMTB } = useMeetings();
  const [visitedNotifications, setVisitedNotifications] = useState<Set<string>>(new Set());

  // Get earliest upcoming meeting for this MTB
  const upcomingMeeting = getUpcomingMeetingForMTB(mtb.id);

  // Notifications simplified - just show empty for now since we don't have shared case tracking
  const notifications: { id: string; text: string; caseId: string }[] = [];

  // Filter out visited notifications
  const unvisitedNotifications = notifications.filter(n => !visitedNotifications.has(n.id));

  const handleNotificationClick = (caseId: string, notificationId: string) => {
    setVisitedNotifications(prev => new Set(prev).add(notificationId));
    navigate(`/cases/${caseId}`);
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/mtbs/${mtb.id}`);
  };

  const handleMeetingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to MTB and set section to meetings
    navigate(`/mtbs/${mtb.id}?section=meetings`);
  };

  const formatMeetingDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, 'EEE, d MMM');
  };

  const formatMeetingTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  return (
    <div
      className={`vmtb-card vmtb-card-hover overflow-hidden animate-fade-in flex flex-col h-56 ${
        isDragging ? 'opacity-50 ring-2 ring-primary cursor-grabbing' : 'cursor-default'
      }`}
    >
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-muted to-muted/50 p-4 relative flex-shrink-0">
        <div className="pr-16">
          <h3 
            onClick={handleTitleClick}
            className={`font-semibold text-foreground cursor-pointer hover:underline ${mtb.name.length > 40 ? 'truncate' : ''}`}
          >
            {mtb.name.length > 40 ? mtb.name.substring(0, 37) + '...' : mtb.name}
          </h3>
          <p className="text-sm text-muted-foreground">{mtb.doctorName}</p>
        </div>
        {/* Avatar - Display actual MTB image if available */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center border-2 border-background">
          {mtb.dpImage ? (
            <img src={mtb.dpImage} alt={mtb.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-t from-primary to-primary/60 relative">
              <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-primary/80 to-transparent rounded-b-full" />
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-sky-300 rounded-full opacity-80" />
            </div>
          )}
        </div>
      </div>

      {/* Middle Section - Upcoming Meeting or Notifications */}
      <div className="p-4 flex-grow overflow-y-auto scrollbar-hide" onClick={(e) => e.stopPropagation()}>
        {/* Show upcoming meeting if available */}
        {upcomingMeeting && (
          <button
            onClick={handleMeetingClick}
            className="w-full text-left text-sm text-primary hover:underline transition-colors mb-2"
          >
            Next meeting: {formatMeetingDate(upcomingMeeting.scheduledDate)} • {formatMeetingTime(upcomingMeeting.scheduledTime)}
          </button>
        )}
        
        {/* Show notifications */}
        {unvisitedNotifications.length > 0 && (
          <div className="space-y-2">
            {unvisitedNotifications.map(notification => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification.caseId, notification.id)}
                className="block w-full text-left text-sm text-primary hover:underline py-1 transition-colors"
              >
                {notification.text}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider - Fixed */}
      <div className="border-t border-border flex-shrink-0"></div>

      {/* Footer - Always at bottom */}
      <div className="px-4 py-3 flex items-center justify-between text-sm flex-shrink-0">
        <span className="text-foreground">{expertCount} {expertCount === 1 ? 'Expert' : 'Experts'}</span>
        <span className="text-foreground">{caseCount} {caseCount === 1 ? 'Case' : 'Cases'}</span>
      </div>
    </div>
  );
};

export default MTBCard;

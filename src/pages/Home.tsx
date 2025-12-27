import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useMeetings } from '@/hooks/useMeetings';
import { toast } from 'sonner';
import { ChevronDown, Video } from 'lucide-react';
import CancerTypeSelect from '@/components/CancerTypeSelect';
import MeetingsModal from '@/components/MeetingsModal';
import { Button } from '@/components/ui/button';
import { formatTime12Hour, formatMeetingDateDisplay, isJoinEnabled, getUpcomingMeetingsSorted } from '@/lib/meetingUtils';
import type { Meeting } from '@/lib/storage';

const Home = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [cancerType, setCancerType] = useState('');
  const [caseName, setCaseName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meetingsModalOpen, setMeetingsModalOpen] = useState(false);
  
  const { setCurrentPatient } = useApp();
  const { profile } = useAuth();
  const { checkCaseNameExists } = useSupabaseData();
  const { meetings, loading: meetingsLoading, joinMeeting } = useMeetings();
  const navigate = useNavigate();

  // Extract doctor name from profile
  const doctorName = profile?.name || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Patient name is optional, all other fields are required
    if (!age || !sex || !cancerType || !caseName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const caseNameExists = await checkCaseNameExists(caseName.trim());
      if (caseNameExists) {
        toast.error('You already have a case with this name. Please choose a different name.');
        return;
      }

      setCurrentPatient({ name, age, sex, cancerType, caseName: caseName.trim() });
      navigate('/upload');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowMoreMeetings = () => {
    setMeetingsModalOpen(true);
  };

  const handleJoinMeeting = (meeting: Meeting) => {
    joinMeeting(meeting);
  };

  return (
    <div className="min-h-screen bg-home-page relative">
      <Header />
      
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 lg:gap-12 items-start">
          {/* Left Column: Welcome + Meetings */}
          <div className="pt-4 lg:pt-8">
            {/* Welcome Section */}
            <div>
              <p className="home-welcome-text">Welcome back,</p>
              <p className="home-doctor-name">
                {doctorName ? `Dr. ${doctorName}` : 'Doctor'}
              </p>
              <p className="home-subtext-new">
                Ready to discuss with experts you trust?
                <br />
                Start with uploading a case.
              </p>
            </div>

            {/* Upcoming Meetings - positioned to align bottom with form */}
            <div className="mt-[220px]">
              <p className="home-discussion-title">Upcoming Discussion</p>
              <div className="home-discussion-card">
                <UpcomingMeetingCardContent meetings={meetings} onJoin={handleJoinMeeting} onShowMore={handleShowMoreMeetings} />
              </div>
            </div>
          </div>

          {/* Right Column: Form Card */}
          <form onSubmit={handleSubmit}>
            <div className="home-form-card">
              {/* Name Field - Optional */}
              <div className="home-form-field">
                <label className="home-form-label">Patient Name (Optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="home-form-input"
                  placeholder="Patient name"
                />
                <p className="home-form-helper">
                  This patient name will remain anonymized and will not be shared with any MTB.
                </p>
              </div>

              {/* Age Field */}
              <div className="home-form-field">
                <label className="home-form-label">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  className="home-form-input"
                  placeholder="Patient age"
                  min="0"
                  max="150"
                />
              </div>

              {/* Sex Field - Themed dropdown */}
              <div className="home-form-field">
                <label className="home-form-label">Sex</label>
                <div className="relative w-full">
                  <select
                    value={sex}
                    onChange={e => setSex(e.target.value)}
                    className="home-form-input w-full appearance-none pr-10 cursor-pointer"
                  >
                    <option value="">Select sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Cancer Type Field - Searchable dropdown */}
              <div className="home-form-field">
                <label className="home-form-label">Cancer Type</label>
                <CancerTypeSelect
                  value={cancerType}
                  onChange={setCancerType}
                  placeholder="Search and select cancer type"
                />
              </div>

              {/* Case Name Field */}
              <div className="home-form-field">
                <label className="home-form-label">Case Name</label>
                <input
                  type="text"
                  value={caseName}
                  onChange={e => setCaseName(e.target.value)}
                  className="home-form-input"
                  placeholder="Enter a unique case name"
                />
                <p className="home-form-helper">
                  When you share this case with any MTB, the case will be referenced using this name.
                </p>
              </div>

              {/* Next Button */}
              <button type="submit" className="home-btn-next" disabled={isSubmitting}>
                {isSubmitting ? 'Checking...' : 'Next'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Meetings Modal */}
      <MeetingsModal 
        open={meetingsModalOpen} 
        onOpenChange={setMeetingsModalOpen} 
        meetings={meetings}
        loading={meetingsLoading}
        onJoin={handleJoinMeeting}
      />
    </div>
  );
};

// Inline component for meeting card content (without the outer wrapper)
const UpcomingMeetingCardContent = ({ meetings, onJoin, onShowMore }: { meetings: Meeting[], onJoin: (meeting: Meeting) => void, onShowMore: () => void }) => {
  // Use the utility function for consistent sorting
  const upcomingMeetings = getUpcomingMeetingsSorted(meetings);
  const nearestMeeting = upcomingMeetings[0];
  const joinEnabled = nearestMeeting ? isJoinEnabled(nearestMeeting) : false;

  return (
    <div>
      {nearestMeeting ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-semibold text-foreground text-base mb-2">
                {nearestMeeting.mtbName || 'MTB Meeting'}
              </h4>
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <span>{formatMeetingDateDisplay(nearestMeeting.scheduledDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span>{formatTime12Hour(nearestMeeting.scheduledTime)}</span>
              </div>
            </div>
            <Button
              size="sm"
              variant={joinEnabled ? "default" : "secondary"}
              onClick={() => onJoin(nearestMeeting)}
              disabled={!joinEnabled}
              className="gap-1.5 flex-shrink-0"
            >
              <Video className="w-4 h-4" />
              Join
            </Button>
          </div>
          <button
            type="button"
            onClick={onShowMore}
            className="mt-3 text-primary hover:underline text-sm font-medium"
          >
            Show more
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-2 text-center">
          <svg className="w-10 h-10 text-muted-foreground/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-muted-foreground text-sm">No upcoming meetings scheduled</p>
        </div>
      )}
    </div>
  );
};

export default Home;

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Edit, Mail, Video, User } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EditProfileModal from './EditProfileModal';
import InvitationsModal, { Invitation } from './InvitationsModal';
import MeetingsModal from './MeetingsModal';
import { useMeetings } from '@/hooks/useMeetings';
import { useInvitations } from '@/hooks/useInvitations';
import { useAuth as getAuth } from '@/contexts/AuthContext';

/**
 * Compact Header component with reduced height
 */
const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [invitationsOpen, setInvitationsOpen] = useState(false);
  const [meetingsOpen, setMeetingsOpen] = useState(false);
  const { meetings, unreadCount: unreadMeetingsCount, markNotificationsRead, loading: meetingsLoading, joinMeeting, deleteMeeting, endMeeting } = useMeetings();
  const { invitations, unreadCount, markInvitationsRead, acceptInvitation, declineInvitation } = useInvitations();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const userInvitations = invitations.filter(inv => inv.status === 'pending');

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleOpenInvitations = () => {
    setInvitationsOpen(true);
    markInvitationsRead();
  };

  const handleAcceptInvitation = async (invitation: Invitation) => {
    await acceptInvitation(invitation.id);
  };

  const handleDeclineInvitation = async (invitation: Invitation) => {
    await declineInvitation(invitation.id);
  };

  const navItems = [
    { label: 'Home', path: '/home' },
    { label: 'Cases', path: '/cases' },
    { label: 'MTBs', path: '/mtbs' },
  ];

  return (
    <>
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="w-full px-4">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <Link to="/home" className="flex items-center gap-2">
              <img src="/vmtblogo.svg" alt="vMTB Logo" className="w-8 h-8" />
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-4 md:gap-6">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`vmtb-tab text-sm ${isActive(item.path) ? 'vmtb-tab-active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative w-8 h-8 hover:ring-2 hover:ring-primary transition-all">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {/* Show notification dot for unread invitations OR unread meetings */}
                    {(unreadCount > 0 || unreadMeetingsCount > 0) && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {profile && (
                    <div className="px-3 py-2 border-b border-border">
                      <p className="font-medium text-sm">{profile.name}</p>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                  )}
                  <DropdownMenuItem onClick={() => setEditProfileOpen(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenInvitations}>
                    <Mail className="w-4 h-4 mr-2" />
                    Invitations
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setMeetingsOpen(true);
                    markNotificationsRead();
                  }}>
                    <Video className="w-4 h-4 mr-2" />
                    Meetings
                    {unreadMeetingsCount > 0 && (
                      <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                        {unreadMeetingsCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </header>

      <EditProfileModal
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
      />

      <InvitationsModal
        open={invitationsOpen}
        onOpenChange={setInvitationsOpen}
        invitations={userInvitations}
        onAccept={handleAcceptInvitation}
        onDecline={handleDeclineInvitation}
      />

      <MeetingsModal
        open={meetingsOpen}
        onOpenChange={setMeetingsOpen}
        meetings={meetings}
        loading={meetingsLoading}
        onJoin={(meeting) => {
          joinMeeting(meeting);
        }}
        onCancel={(meetingId) => {
          deleteMeeting(meetingId);
        }}
        onEndMeeting={(meetingId) => {
          endMeeting(meetingId);
        }}
        currentUserId={user?.id}
      />
    </>
  );
};

export default Header;

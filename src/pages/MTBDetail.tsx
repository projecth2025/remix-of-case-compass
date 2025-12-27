import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { X, User, Search, Eye, Pencil, Trash2, Calendar, Clock, Video } from 'lucide-react';
import Header from '@/components/Header';
import MTBSidebar from '@/components/MTBSidebar';
import AddExpertModal from '@/components/AddExpertModal';
import AddCaseToMTBModal from '@/components/AddCaseToMTBModal';
import ConfirmModal from '@/components/ConfirmModal';
import ScheduleMeetModal from '@/components/ScheduleMeetModal';
import { useMTBs, MTBMember, MTBCase } from '@/hooks/useMTBs';
import { useInvitations } from '@/hooks/useInvitations';
import { useMeetings } from '@/hooks/useMeetings';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { formatTime12Hour, formatMeetingDateShort, isJoinEnabled, hasMeetingStarted } from '@/lib/meetingUtils';
import type { Meeting } from '@/lib/storage';

/**
 * MTBDetail page with owner/enrolled behaviors:
 * - Owner: Can see Add Expert button and remove experts
 * - Enrolled: Shows polite disclaimer instead
 * - Collapsible sidebar for navigation
 */
const MTBDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Hooks
  const { mtbs, loading: mtbsLoading, getMTBMembers, getMTBCases, addCasesToMTB, removeCaseFromMTB, removeMemberFromMTB } = useMTBs();
  const { sendInvitations } = useInvitations();
  const { meetings, createMeeting, deleteMeeting, endMeeting, joinMeeting, getMeetingsForMTB } = useMeetings();
  
  // Get section from query params
  const sectionFromUrl = searchParams.get('section');
  const [activeSection, setActiveSection] = useState(sectionFromUrl || 'mycases');
  
  const [showAddExpert, setShowAddExpert] = useState(false);
  const [showAddCase, setShowAddCase] = useState(false);
  const [showScheduleMeet, setShowScheduleMeet] = useState(false);
  const [expertToRemove, setExpertToRemove] = useState<string | null>(null);
  const [removeExpertModalOpen, setRemoveExpertModalOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);
  const [deleteCaseModalOpen, setDeleteCaseModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [meetingToCancel, setMeetingToCancel] = useState<Meeting | null>(null);
  const [cancelMeetingModalOpen, setCancelMeetingModalOpen] = useState(false);
  
  // MTB data state
  const [mtbMembers, setMtbMembers] = useState<MTBMember[]>([]);
  const [mtbCases, setMtbCases] = useState<MTBCase[]>([]);
  const [mtbMeetings, setMtbMeetings] = useState<Meeting[]>([]);
  
  // Update active section when URL changes
  useEffect(() => {
    if (sectionFromUrl && ['mycases', 'shared', 'experts', 'meetings'].includes(sectionFromUrl)) {
      setActiveSection(sectionFromUrl);
    }
  }, [sectionFromUrl]);

  // Get MTB from state
  const mtb = id ? mtbs.find(m => m.id === id) : null;
  
  // Load MTB data - only trigger on id change to avoid infinite loop
  useEffect(() => {
    if (id) {
      getMTBMembers(id).then(setMtbMembers);
      getMTBCases(id).then(setMtbCases);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  
  // Update meetings when meetings state changes
  useEffect(() => {
    if (id) {
      setMtbMeetings(getMeetingsForMTB(id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, meetings]);

  // Show loading state while MTBs are being fetched
  if (mtbsLoading) {
    return (
      <div className="min-h-screen bg-muted flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Defensive checks - after all hooks
  if (!id) {
    return (
      <div className="min-h-screen bg-muted flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Invalid MTB ID</h2>
            <p className="text-muted-foreground mb-4">No MTB ID was provided.</p>
            <button
              onClick={() => navigate('/mtbs')}
              className="px-4 py-2 vmtb-btn-primary rounded-lg"
            >
              Back to MTBs
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!mtb) {
    return (
      <div className="min-h-screen bg-muted flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">MTB Not Found</h2>
            <p className="text-muted-foreground mb-4">The MTB you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/mtbs')}
              className="px-4 py-2 vmtb-btn-primary rounded-lg"
            >
              Back to MTBs
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if current user is owner
  const isOwner = mtb.isOwner;

  const handleAddExpert = async (email: string) => {
    await sendInvitations(mtb.id, [email]);
  };

  const handleAddCases = async (caseIds: string[]) => {
    await addCasesToMTB(mtb.id, caseIds);
    const updatedCases = await getMTBCases(mtb.id);
    setMtbCases(updatedCases);
    setShowAddCase(false);
  };

  const handleRemoveExpertClick = (userId: string) => {
    setExpertToRemove(userId);
    setRemoveExpertModalOpen(true);
  };

  const handleConfirmRemoveExpert = async () => {
    if (expertToRemove) {
      await removeMemberFromMTB(mtb.id, expertToRemove);
      const updatedMembers = await getMTBMembers(mtb.id);
      setMtbMembers(updatedMembers);
    }
    setRemoveExpertModalOpen(false);
    setExpertToRemove(null);
  };

  const handleDeleteCaseClick = (caseId: string) => {
    setCaseToDelete(caseId);
    setDeleteCaseModalOpen(true);
  };

  const handleConfirmDeleteCase = async () => {
    if (caseToDelete) {
      await removeCaseFromMTB(mtb.id, caseToDelete);
      const updatedCases = await getMTBCases(mtb.id);
      setMtbCases(updatedCases);
    }
    setDeleteCaseModalOpen(false);
    setCaseToDelete(null);
  };

  const handleCancelMeetingClick = (meeting: Meeting) => {
    setMeetingToCancel(meeting);
    setCancelMeetingModalOpen(true);
  };

  const handleConfirmCancelMeeting = async () => {
    if (meetingToCancel) {
      await deleteMeeting(meetingToCancel.id);
      const updatedMeetings = await getMeetingsForMTB(mtb.id);
      setMtbMeetings(updatedMeetings);
    }
    setCancelMeetingModalOpen(false);
    setMeetingToCancel(null);
  };

  const handleJoinMeeting = (meeting: Meeting) => {
    joinMeeting(meeting);
  };

  // Filter content based on search and section
  const query = searchQuery.toLowerCase();
  
  // Filter cases based on section: mycases shows user's added cases, shared shows all
  const sectionFilteredCases = activeSection === 'mycases' 
    ? mtbCases.filter(c => c.addedBy === user?.id)
    : mtbCases;
  
  const filteredCases = query
    ? sectionFilteredCases.filter(c => c.caseName.toLowerCase().includes(query) || c.patientName.toLowerCase().includes(query))
    : sectionFilteredCases;
  const filteredExperts = query
    ? mtbMembers.filter(m => m.userName.toLowerCase().includes(query) || (m.userProfession || '').toLowerCase().includes(query))
    : mtbMembers;

  const renderContent = () => {
    switch (activeSection) {
      case 'mycases':
      case 'shared':
        return (
          <div className="p-4 md:p-6 animate-fade-in h-full overflow-y-auto">
            <div className="vmtb-card p-6">
              {/* Header with MTB name and search */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border flex-shrink-0">
                    {mtb.dpImage ? (
                      <img src={mtb.dpImage} alt={mtb.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary/60" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{mtb.name}</h2>
                    <p className="text-sm text-muted-foreground">{activeSection === 'mycases' ? 'My Cases' : 'All Cases'}</p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {filteredCases.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No cases have been added to this MTB yet.</p>
                  <p className="text-sm mt-2">Use the sidebar to add cases.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Case Name</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Patient Name</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cancer Type</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Added</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCases.map(caseItem => (
                        <tr key={caseItem.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4 text-foreground font-medium">{caseItem.caseName}</td>
                          <td className="py-4 px-4 text-foreground">{caseItem.patientName}</td>
                          <td className="py-4 px-4 text-foreground">{caseItem.cancerType || 'N/A'}</td>
                          <td className="py-4 px-4 text-foreground text-sm">{new Date(caseItem.addedAt).toLocaleDateString()}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => navigate(`/cases/${caseItem.caseId}`)}
                                className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                                title="View case"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {isOwner && (
                                <button 
                                  onClick={() => handleDeleteCaseClick(caseItem.caseId)}
                                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                                  title="Remove from MTB"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case 'experts':
        return (
          <div className="p-4 md:p-6 animate-fade-in h-full overflow-y-auto">
            <div className="vmtb-card p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border flex-shrink-0">
                    {mtb.dpImage ? (
                      <img src={mtb.dpImage} alt={mtb.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary/60" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{mtb.name}</h2>
                    <p className="text-sm text-muted-foreground">Experts</p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Non-owner disclaimer for member management */}
              {!isOwner && (
                <div className="mb-6 p-4 bg-muted/50 border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Only the MTB owner can add or remove members.
                  </p>
                </div>
              )}

              {filteredExperts.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No experts in this MTB yet.</p>
                  {isOwner && <p className="text-sm mt-2">Use the sidebar to invite experts.</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredExperts.map(member => (
                    <div 
                      key={member.id}
                      className="p-4 border border-border rounded-lg bg-card hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                            {member.userAvatar ? (
                              <img src={member.userAvatar} alt={member.userName} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{member.userName}</p>
                            <p className="text-sm text-muted-foreground">{member.userProfession || 'Expert'}</p>
                          </div>
                        </div>
                        {isOwner && member.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveExpertClick(member.userId)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                            title="Remove expert"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          {member.role === 'owner' ? 'Owner' : `Joined ${new Date(member.joinedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'meetings':
        return (
          <div className="p-4 md:p-6 animate-fade-in h-full overflow-y-auto">
            <div className="vmtb-card p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border flex-shrink-0">
                    {mtb.dpImage ? (
                      <img src={mtb.dpImage} alt={mtb.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary/60" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{mtb.name}</h2>
                    <p className="text-sm text-muted-foreground">Meetings</p>
                  </div>
                </div>
              </div>

              {mtbMeetings.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No meetings scheduled.</p>
                  <p className="text-sm mt-2">Use the sidebar to schedule a meeting.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mtbMeetings.map(meeting => {
                    const joinEnabled = isJoinEnabled(meeting);
                    
                    return (
                      <div 
                        key={meeting.id}
                        className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {formatMeetingDateShort(meeting.scheduledDate)}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatTime12Hour(meeting.scheduledTime)}</span>
                              {meeting.scheduleType === 'custom' && meeting.repeatDays && meeting.repeatDays.length > 0 && (
                                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  Recurring
                                </span>
                              )}
                              {meeting.status === 'in_progress' && (
                                <span className="ml-2 text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">
                                  In Progress
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={joinEnabled ? "default" : "secondary"}
                            onClick={() => handleJoinMeeting(meeting)}
                            disabled={!joinEnabled}
                            className="gap-1.5"
                          >
                            <Video className="w-4 h-4" />
                            Join
                          </Button>
                          {(isOwner || meeting.createdBy === user?.id) && (
                            hasMeetingStarted(meeting) ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => endMeeting(meeting.id)}
                                className="gap-1.5"
                              >
                                <X className="w-4 h-4" />
                                End Meet
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelMeetingClick(meeting)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 md:p-6 flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p>Invalid section selected</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-muted flex flex-col overflow-hidden">
      <Header />
      
      {/* Main layout with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Fixed position */}
        <MTBSidebar
          activeSection={activeSection}
          onSectionChange={(section) => {
            setActiveSection(section);
            setSearchQuery('');
          }}
          isOwner={isOwner}
          onAddCase={() => setShowAddCase(true)}
          onScheduleMeet={() => setShowScheduleMeet(true)}
          onAddExpert={() => setShowAddExpert(true)}
          onCollapsedChange={setIsSidebarCollapsed}
        />

        {/* Main Content - with left margin to account for fixed sidebar */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-56'}`}>
          {renderContent()}
        </main>
      </div>

      {/* Add Expert Modal */}
      <AddExpertModal
        open={showAddExpert}
        onOpenChange={setShowAddExpert}
        onAdd={handleAddExpert}
      />

      {/* Add Case to MTB Modal */}
      <AddCaseToMTBModal
        open={showAddCase}
        onOpenChange={setShowAddCase}
        onAddCases={handleAddCases}
      />

      {/* Schedule Meet Modal */}
      <ScheduleMeetModal
        open={showScheduleMeet}
        onOpenChange={setShowScheduleMeet}
        mtbId={mtb.id}
        mtbName={mtb.name}
        onSchedule={async (scheduledDate, scheduledTime, scheduleType, repeatDays) => {
          const dateObj = new Date(scheduledDate);
          await createMeeting(mtb.id, dateObj, scheduledTime, scheduleType, repeatDays);
          setMtbMeetings(getMeetingsForMTB(mtb.id));
        }}
      />

      {/* Remove Expert Confirmation Modal */}
      <ConfirmModal
        open={removeExpertModalOpen}
        onOpenChange={setRemoveExpertModalOpen}
        title="Remove Expert"
        description="Are you sure you want to remove this expert from the MTB?"
        confirmLabel="Remove"
        onConfirm={handleConfirmRemoveExpert}
        destructive
      />

      {/* Delete Case Confirmation Modal */}
      <ConfirmModal
        open={deleteCaseModalOpen}
        onOpenChange={setDeleteCaseModalOpen}
        title="Remove Case"
        description="Are you sure you want to remove this case from the MTB?"
        confirmLabel="Remove"
        onConfirm={handleConfirmDeleteCase}
        destructive
      />

      {/* Cancel Meeting Confirmation Modal */}
      <ConfirmModal
        open={cancelMeetingModalOpen}
        onOpenChange={setCancelMeetingModalOpen}
        title="Cancel Meeting"
        description="Are you sure you want to cancel this meeting? This action cannot be undone."
        confirmLabel="Confirm Cancel"
        onConfirm={handleConfirmCancelMeeting}
        destructive
      />
    </div>
  );
};

export default MTBDetail;
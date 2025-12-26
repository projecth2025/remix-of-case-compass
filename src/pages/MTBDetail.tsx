import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { X, User, Search, Eye, Pencil, Trash2, Calendar, Clock, Video } from 'lucide-react';
import Header from '@/components/Header';
import MTBSidebar from '@/components/MTBSidebar';
import AddExpertModal from '@/components/AddExpertModal';
import AddCaseToMTBModal from '@/components/AddCaseToMTBModal';
import ConfirmModal from '@/components/ConfirmModal';
import ScheduleMeetModal from '@/components/ScheduleMeetModal';
import { useApp } from '@/contexts/AppContext';
import { useMeetings } from '@/hooks/useMeetings';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { formatTime12Hour, formatMeetingDateShort, isJoinEnabled } from '@/lib/meetingUtils';
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
  const { state, removeExpertFromMTB, sendInvitations, addCasesToMTB, removeCaseFromMTB, loadCaseForEditing } = useApp();
  
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
  
  // All hooks must be called before any conditional returns
  const { createMeeting, deleteMeeting, joinMeeting, getMeetingsForMTB } = useMeetings();
  
  // Update active section when URL changes
  useEffect(() => {
    if (sectionFromUrl && ['mycases', 'shared', 'experts', 'meetings'].includes(sectionFromUrl)) {
      setActiveSection(sectionFromUrl);
    }
  }, [sectionFromUrl]);

  // Get MTB from state
  const mtb = id ? state.mtbs.find(m => m.id === id) : null;

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
    console.warn(`MTB with ID "${id}" not found in state. Available MTB IDs:`, state.mtbs.map(m => m.id));
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

  // Get cases associated with this MTB
  const myCases = state.cases.filter(c => mtb.cases.includes(c.id));
  const sharedCases = state.cases.filter(c => mtb.cases.includes(c.id)).slice(0, 2);

  // Get experts for this MTB
  const mtbExperts = state.experts.filter(e => mtb.experts.includes(e.id));

  const handleAddExpert = (email: string) => {
    if (sendInvitations) {
      sendInvitations(mtb.id, mtb.name, [email]);
    }
    console.log('Adding expert:', { email });
  };

  const handleAddCases = (caseIds: string[]) => {
    if (addCasesToMTB) {
      addCasesToMTB(mtb.id, caseIds);
      setShowAddCase(false);
    }
  };

  const handleRemoveExpertClick = (expertId: string) => {
    setExpertToRemove(expertId);
    setRemoveExpertModalOpen(true);
  };

  const handleConfirmRemoveExpert = () => {
    if (expertToRemove && removeExpertFromMTB) {
      removeExpertFromMTB(mtb.id, expertToRemove);
    }
    setRemoveExpertModalOpen(false);
    setExpertToRemove(null);
  };

  const handleDeleteCaseClick = (caseId: string) => {
    setCaseToDelete(caseId);
    setDeleteCaseModalOpen(true);
  };

  const handleConfirmDeleteCase = () => {
    if (caseToDelete && removeCaseFromMTB) {
      removeCaseFromMTB(mtb.id, caseToDelete);
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
    }
    setCancelMeetingModalOpen(false);
    setMeetingToCancel(null);
  };

  const handleJoinMeeting = (meeting: Meeting) => {
    // Use joinMeeting to reuse existing meeting link
    joinMeeting(meeting);
  };

  // Filter content based on search
  const query = searchQuery.toLowerCase();
  const filteredMyCases = query
    ? myCases.filter(c => c.caseName.toLowerCase().includes(query) || c.patient.name.toLowerCase().includes(query))
    : myCases;
  const filteredSharedCases = query
    ? sharedCases.filter(c => c.caseName.toLowerCase().includes(query) || c.patient.name.toLowerCase().includes(query))
    : sharedCases;
  const filteredExperts = query
    ? mtbExperts.filter(e => e.name.toLowerCase().includes(query) || e.specialty.toLowerCase().includes(query))
    : mtbExperts;

  const renderContent = () => {
    switch (activeSection) {
      case 'mycases':
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
                    <p className="text-sm text-muted-foreground">My Cases</p>
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

              {filteredMyCases.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No cases have been added to this MTB yet.</p>
                  {isOwner && <p className="text-sm mt-2">Use the sidebar to add cases.</p>}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Case Name</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Patient Name</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Patient Info</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cancer Type</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Created Date</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMyCases.map(caseItem => (
                        <tr key={caseItem.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4 text-foreground font-medium">{caseItem.caseName}</td>
                          <td className="py-4 px-4 text-foreground">{caseItem.patient.name}</td>
                          <td className="py-4 px-4 text-foreground">
                            {caseItem.patient.age}y, {caseItem.patient.sex.charAt(0).toUpperCase()}
                          </td>
                          <td className="py-4 px-4 text-foreground">{caseItem.patient.cancerType}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              caseItem.status === 'Completed' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {caseItem.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-foreground text-sm">{new Date(caseItem.createdDate).toLocaleDateString()}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => navigate(`/cases/${caseItem.id}`)}
                                className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                                title="View case"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (loadCaseForEditing(caseItem.id)) {
                                    navigate(`/upload/preview/0`);
                                  }
                                }}
                                className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors"
                                title="Edit case"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteCaseClick(caseItem.id)}
                                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                                title="Delete case"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
                    <p className="text-sm text-muted-foreground">Shared Cases</p>
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

              {filteredSharedCases.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No shared cases in this MTB yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Case Name</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Shared By</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Patient Name</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Patient Info</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cancer Type</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Created Date</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSharedCases.map(caseItem => (
                        <tr key={caseItem.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4 text-foreground font-medium">{caseItem.caseName}</td>
                          <td className="py-4 px-4 text-foreground text-sm">{state.users.find(u => u.id === caseItem.ownerId)?.name || 'Unknown'}</td>
                          <td className="py-4 px-4 text-foreground">{caseItem.patient.name}</td>
                          <td className="py-4 px-4 text-foreground">
                            {caseItem.patient.age}y, {caseItem.patient.sex.charAt(0).toUpperCase()}
                          </td>
                          <td className="py-4 px-4 text-foreground">{caseItem.patient.cancerType}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              caseItem.status === 'Completed' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {caseItem.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-foreground text-sm">{new Date(caseItem.createdDate).toLocaleDateString()}</td>
                          <td className="py-4 px-4">
                            <button 
                              onClick={() => navigate(`/cases/${caseItem.id}`)}
                              className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                              title="View case"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
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

              {filteredExperts.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No experts in this MTB yet.</p>
                  {isOwner && <p className="text-sm mt-2">Use the sidebar to add experts.</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredExperts.map(expert => (
                    <div 
                      key={expert.id}
                      className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {expert.avatar ? (
                            <img src={expert.avatar} alt={expert.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{expert.name}</p>
                          <p className="text-xs text-muted-foreground">{expert.specialty}</p>
                        </div>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveExpertClick(expert.id)}
                          className="p-1.5 hover:bg-destructive/10 text-destructive rounded-full transition-colors flex-shrink-0"
                          title="Remove expert"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isOwner && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    To add experts to this MTB, please contact the MTB creator.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'meetings':
        const mtbMeetings = getMeetingsForMTB(mtb.id);
        // Meetings are already sorted from getMeetingsForMTB

        return (
          <div className="p-4 md:p-6 animate-fade-in h-full flex flex-col overflow-hidden">
            <div className="vmtb-card p-6 flex flex-col h-full overflow-hidden">
              {/* Header with MTB name */}
              <div className="flex items-center justify-between mb-6 flex-shrink-0">
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
                    <p className="text-sm text-muted-foreground">Scheduled Meetings</p>
                  </div>
                </div>
              </div>

              {mtbMeetings.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground flex-1">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No upcoming meetings scheduled for this MTB.</p>
                  {isOwner && <p className="text-sm mt-2">Use "Schedule a Meet" in the sidebar to schedule one.</p>}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
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
                              {formatMeetingDateShort(meeting.scheduled_date)}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatTime12Hour(meeting.scheduled_time)}</span>
                              {meeting.schedule_type === 'custom' && meeting.repeat_days && meeting.repeat_days.length > 0 && (
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
                            {meeting.status === 'in_progress' ? 'Rejoin' : 'Join'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelMeetingClick(meeting)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            Cancel
                          </Button>
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

  try {
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
          onSchedule={async (scheduledDate, scheduledTime, scheduleType, repeatDays, explicitDates) => {
            await createMeeting(mtb.id, mtb.name, scheduledDate, scheduledTime, scheduleType, repeatDays, explicitDates);
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
          title="Delete Case"
          description="Are you sure you want to delete this case? This action cannot be undone."
          confirmLabel="Delete"
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
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("MTB DETAIL RENDER ERROR:", err);
    return (
      <div className="min-h-screen bg-muted flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-red-200 p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-700 mb-2">Render Error</h2>
            <p className="text-sm text-gray-600 mb-4">Failed to render MTB detail page:</p>
            <div className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 mb-4 overflow-auto max-h-32">
              {errorMessage}
            </div>
            <button
              onClick={() => navigate('/mtbs')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to MTBs
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default MTBDetail;

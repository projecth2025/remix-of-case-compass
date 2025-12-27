import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, MoreVertical, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import ZoomablePreview from '@/components/ZoomablePreview';
import ExpertList from '@/components/ExpertList';
import PrivateChatBox from '@/components/PrivateChatBox';
import GroupChat from '@/components/GroupChat';
import { useSupabaseData, FullCase } from '@/hooks/useSupabaseData';
import { useGroupMessages } from '@/hooks/useGroupMessages';
import { useCaseExperts } from '@/hooks/useCaseExperts';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Expert, UploadedFile } from '@/lib/storage';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ConfirmModal from '@/components/ConfirmModal';
import { supabase } from '@/integrations/supabase/client';

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'reports', label: 'Reports' },
  { id: 'experts', label: 'Experts' },
  { id: 'treatment', label: 'Treatment Plan' },
];

/**
 * CaseView page with updated layout:
 * - Profile: Shows Name, Age, Sex, Cancer Type with download buttons
 * - Reports: Left list, right full-size preview only (no JSON panel)
 * - Experts: Group chat default, private chat when expert selected
 * - Compact navbar heights
 */
const CaseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadCaseForEditing, loading } = useSupabaseData();
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedReport, setSelectedReport] = useState<UploadedFile | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [chatMode, setChatMode] = useState<'group' | 'private'>('group');
  const [caseData, setCaseData] = useState<FullCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportToDelete, setReportToDelete] = useState<UploadedFile | null>(null);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  // Fetch experts for this case
  const { experts: caseExperts, mtbId, loading: expertsLoading } = useCaseExperts(id || '');

  // Group messages hook
  const { messages: groupMessages, sendMessage: sendGroupMessage } = useGroupMessages(mtbId || '', id);

  // Unread messages tracking
  const { hasPrivateUnread, hasGroupUnread, markPrivateAsRead, markGroupAsRead } = useUnreadMessages();

  // Load case data from database - always use loadCaseForEditing for full file data
  useEffect(() => {
    const loadCase = async () => {
      if (!id) {
        navigate('/cases');
        return;
      }

      setIsLoading(true);
      
      // Always load with full document data to get anonymized PDF pages
      const loadedCase = await loadCaseForEditing(id);
      if (loadedCase) {
        setCaseData(loadedCase);
      } else {
        toast.error('Case not found');
        navigate('/cases');
      }
      setIsLoading(false);
    };

    loadCase();
  }, [id, loadCaseForEditing, navigate]);

  if (isLoading || loading) {
    return (
      <div className="h-screen bg-muted flex flex-col">
        <Header />
        {/* Compact Tab Bar */}
        <div className="bg-background border-b border-border flex-shrink-0">
          <div className="w-full px-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex space-x-4">
                <div className="w-16 h-4 bg-muted rounded"></div>
                <div className="w-16 h-4 bg-muted rounded"></div>
                <div className="w-16 h-4 bg-muted rounded"></div>
                <div className="w-24 h-4 bg-muted rounded"></div>
              </div>
              <div className="w-6 h-6 bg-muted rounded"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!caseData) {
    return null;
  }

  const handleSelectExpert = (expert: Expert) => {
    setSelectedExpert(expert);
    setChatMode('private');
    // Mark private chat as read when opened
    markPrivateAsRead(expert.id, id);
  };

  const handleSwitchToGroup = () => {
    setSelectedExpert(null);
    setChatMode('group');
    // Mark group chat as read when opened
    if (mtbId) {
      markGroupAsRead(mtbId, id || null);
    }
  };

  const handleSendGroupMessage = (content: string, isAnonymous: boolean) => {
    sendGroupMessage(content, isAnonymous);
  };

  const handleDownloadReport = () => {
    toast.info('Patient report download coming soon');
  };

  const handleDownloadPresentation = () => {
    toast.info('Patient presentation download coming soon');
  };

  // Format upload date/time for display
  const formatUploadDateTime = (file: UploadedFile) => {
    const dateStr = file.uploadedAt || file.createdAt;
    if (!dateStr) return 'Unknown date';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Sort files by upload date descending (most recent first)
  const getSortedFiles = () => {
    if (!caseData) return [];
    return [...caseData.files].sort((a, b) => {
      const dateA = new Date(a.uploadedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.uploadedAt || b.createdAt || 0).getTime();
      return dateB - dateA; // Descending order
    });
  };

  // Handle report deletion
  const handleDeleteReport = async () => {
    if (!reportToDelete || !caseData || !user) return;

    setIsDeletingReport(true);
    try {
      // Delete from documents table
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', reportToDelete.id);

      if (dbError) {
        console.error('Error deleting document from database:', dbError);
        toast.error('Failed to delete report');
        return;
      }

      // Update local state
      const updatedFiles = caseData.files.filter(f => f.id !== reportToDelete.id);
      setCaseData({ ...caseData, files: updatedFiles });

      // Clear selected report if it was the deleted one
      if (selectedReport?.id === reportToDelete.id) {
        setSelectedReport(updatedFiles.length > 0 ? updatedFiles[0] : null);
      }

      toast.success('Report deleted successfully');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    } finally {
      setIsDeletingReport(false);
      setReportToDelete(null);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="p-4 md:p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Patient Profile</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadReport}
                  className="vmtb-btn-outline flex items-center gap-2 px-3 py-1.5 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
                <button
                  onClick={handleDownloadPresentation}
                  className="vmtb-btn-outline flex items-center gap-2 px-3 py-1.5 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download Presentation
                </button>
              </div>
            </div>
            <div className="vmtb-card p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">{caseData.patient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium text-foreground">{caseData.patient.age} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sex</p>
                  <p className="font-medium text-foreground">{caseData.patient.sex}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cancer Type</p>
                  <p className="font-medium text-foreground">{caseData.patient.cancerType}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reports':
        const sortedFiles = getSortedFiles();
        return (
          <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] animate-fade-in">
            {/* Reports List - narrow sidebar */}
            <div className="w-full md:w-56 lg:w-64 border-b md:border-b-0 md:border-r border-border p-3 overflow-y-auto hide-scrollbar flex-shrink-0">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Reports</h3>
              {sortedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors mb-2 text-sm flex items-start justify-between gap-1 ${
                    selectedReport?.id === file.id
                      ? 'bg-primary/10 text-foreground border border-primary/30'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <button
                    onClick={() => setSelectedReport(file)}
                    className="flex-1 text-left min-w-0"
                  >
                    <span className="block font-medium truncate">{file.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatUploadDateTime(file)}
                    </span>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-1 rounded hover:bg-muted-foreground/10 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => setReportToDelete(file)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>

            {/* Full-size Preview Only */}
            <div className="flex-1 p-4 overflow-hidden">
              <div className="h-full border border-border rounded-lg overflow-hidden hide-scrollbar">
                <ZoomablePreview file={selectedReport} />
              </div>
            </div>
          </div>
        );

      case 'experts':
        return (
          <div className="p-0 md:p-0 animate-fade-in flex flex-col h-full">
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex gap-4 flex-1 min-h-0">
                {/* Experts List */}
                <div className="w-64 lg:w-72 border-r border-border flex flex-col">
                  <div className="p-4">
                    <input
                      type="text"
                      placeholder="Search experts"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto hide-scrollbar pr-4 pl-4 pt-0">
                    {expertsLoading ? (
                      <div className="text-center text-muted-foreground py-4">Loading experts...</div>
                    ) : caseExperts.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">No experts assigned to this case</div>
                    ) : (
                      <ExpertList
                        experts={caseExperts.filter(e => 
                          e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.specialty.toLowerCase().includes(searchTerm.toLowerCase())
                        )}
                        selectedExpert={selectedExpert}
                        onSelectExpert={handleSelectExpert}
                        hasUnread={hasPrivateUnread}
                      />
                    )}
                  </div>
                  <div className="p-4 mt-auto">
                    <div className="flex justify-center">
                      <button
                        onClick={handleSwitchToGroup}
                        className={`relative px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
                          chatMode === 'group' ? 'bg-muted text-muted-foreground hover:text-foreground border border-border' : 'bg-vmtb-green text-white'
                        }`}
                        aria-label="Group chat"
                      >
                        Group Chat
                        {/* Unread indicator for group chat */}
                        {mtbId && hasGroupUnread(mtbId, id || null) && chatMode !== 'group' && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 bg-primary/5">
                  {chatMode === 'group' ? (
                    <GroupChat
                      caseId={caseData.id}
                      messages={groupMessages.map(m => ({
                        id: m.id,
                        senderId: m.senderId,
                        senderName: m.senderName,
                        content: m.content,
                        timestamp: m.createdAt,
                        isAnonymous: m.isAnonymous,
                      }))}
                      onSendMessage={handleSendGroupMessage}
                    />
                  ) : selectedExpert ? (
                    <PrivateChatBox expert={selectedExpert} caseId={caseData.id} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Select an expert to start a private chat
                    </div>
                  )}
                </div>
              </div>


            </div>
          </div>
        );

      case 'treatment':
        return (
          <div className="p-4 md:p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-foreground mb-4">Treatment Plan</h2>
            <div className="vmtb-card p-6">
              <p className="text-muted-foreground mb-4">
                Treatment plan will be added after expert consultation.
              </p>
              <textarea
                placeholder="Enter treatment plan notes..."
                className="vmtb-input min-h-[200px]"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-muted flex flex-col">
      <Header />
      
      {/* Compact Tab Bar */}
      <div className="bg-background border-b border-border flex-shrink-0">
        <div className="w-full px-4">
          <div className="flex items-center justify-between py-2">
            <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            <button
              onClick={() => navigate('/cases')}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <main className="w-full flex-1 overflow-hidden flex flex-col">
        {renderTabContent()}
      </main>

      {/* Delete Report Confirmation Modal */}
      <ConfirmModal
        open={!!reportToDelete}
        onOpenChange={(open) => !open && setReportToDelete(null)}
        title="Delete Report?"
        description={`Are you sure you want to delete "${reportToDelete?.name}"? This action cannot be undone.`}
        confirmLabel={isDeletingReport ? 'Deleting...' : 'Delete'}
        onConfirm={handleDeleteReport}
        destructive
      />
    </div>
  );
};

export default CaseView;
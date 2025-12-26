import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import ZoomablePreview from '@/components/ZoomablePreview';
import ExpertList from '@/components/ExpertList';
import ChatBox from '@/components/ChatBox';
import GroupChat from '@/components/GroupChat';
import { useApp } from '@/contexts/AppContext';
import { useSupabaseData, FullCase } from '@/hooks/useSupabaseData';
import { Expert, UploadedFile } from '@/lib/storage';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { state, sendGroupMessage } = useApp();
  const { loadCaseForEditing, loading } = useSupabaseData();
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedReport, setSelectedReport] = useState<UploadedFile | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [chatMode, setChatMode] = useState<'group' | 'private'>('group');
  const [caseData, setCaseData] = useState<FullCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const groupChatKey = `${caseData.id}-group`;
  const groupMessages = state.chats[groupChatKey] || [];

  const handleSelectExpert = (expert: Expert) => {
    setSelectedExpert(expert);
    setChatMode('private');
  };

  const handleSwitchToGroup = () => {
    setSelectedExpert(null);
    setChatMode('group');
  };

  const handleSendGroupMessage = (content: string) => {
    sendGroupMessage(caseData.id, content);
  };

  const handleDownloadReport = () => {
    toast.info('Patient report download coming soon');
  };

  const handleDownloadPresentation = () => {
    toast.info('Patient presentation download coming soon');
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
        return (
          <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] animate-fade-in">
            {/* Reports List - narrow sidebar */}
            <div className="w-full md:w-48 lg:w-56 border-b md:border-b-0 md:border-r border-border p-3 overflow-y-auto hide-scrollbar flex-shrink-0">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Reports</h3>
              {caseData.files.map((file, index) => (
                <button
                  key={file.id}
                  onClick={() => setSelectedReport(file)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors mb-2 text-sm ${
                    selectedReport?.id === file.id
                      ? 'bg-primary/10 text-foreground border border-primary/30'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  Report {index + 1}
                  <span className="block text-xs text-muted-foreground truncate">{file.name}</span>
                </button>
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
                    <ExpertList
                      experts={state.experts.filter(expert => 
                        expert.name.toLowerCase().includes(searchTerm.toLowerCase())
                      )}
                      selectedExpert={selectedExpert}
                      onSelectExpert={handleSelectExpert}
                    />
                  </div>
                  <div className="p-4 mt-auto">
                    <div className="flex justify-center">
                      <button
                        onClick={handleSwitchToGroup}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
                          chatMode === 'group' ? 'bg-muted text-muted-foreground hover:text-foreground border border-border' : 'bg-vmtb-green text-white'
                        }`}
                        aria-label="Group chat"
                      >
                        Group Chat
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 min-w-0 bg-primary/5">
                  {chatMode === 'group' ? (
                    <GroupChat
                      caseId={caseData.id}
                      messages={groupMessages}
                      onSendMessage={handleSendGroupMessage}
                    />
                  ) : selectedExpert ? (
                    <ChatBox expert={selectedExpert} caseId={caseData.id} />
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
    </div>
  );
};

export default CaseView;
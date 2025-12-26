import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import MTBCard from '@/components/MTBCard';
import CreateMTBModal from '@/components/CreateMTBModal';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { MTB } from '@/lib/storage';

const tabs = [
  { id: 'my', label: 'My MTBs' },
  { id: 'enrolled', label: 'Enrolled MTBs' },
];

const MTBsList = () => {
  const { state, createMTB, sendInvitations } = useApp();
  const [activeTab, setActiveTab] = useState('my');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const myMTBs = state.mtbs.filter(m => m.isOwner);
  const enrolledMTBs = state.mtbs.filter(m => !m.isOwner);

  const displayedMTBs = activeTab === 'my' ? myMTBs : enrolledMTBs;

  const handleCreateMTB = (data: {
    name: string;
    dpImage: string | null;
    expertEmails: string[];
    caseIds: string[];
  }) => {
    if (createMTB) {
      const newMTB = createMTB(data.name, data.dpImage, data.caseIds);
      // Send invitations to expert emails
      if (sendInvitations && newMTB) {
        sendInvitations(newMTB.id, newMTB.name, data.expertEmails);
      }
    }
  };

  // Drag and Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      // Reorder the MTBs
      const reorderedMTBs = [...displayedMTBs];
      const [draggedItem] = reorderedMTBs.splice(draggedIndex, 1);
      reorderedMTBs.splice(dropIndex, 0, draggedItem);
      
      // Reordering is visual only (state persists in component)
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, displayedMTBs, activeTab]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <div className="fixed top-12 left-0 right-0 bg-background border-b border-border z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            <Button
              onClick={() => setCreateModalOpen(true)}
              size="sm"
              className="rounded-full my-2"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create MTB
            </Button>
          </div>
        </div>
      </div>

      <main className="fixed top-[calc(3rem+2.75rem)] left-0 right-0 bottom-0 overflow-y-auto scrollbar-hide overscroll-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedMTBs.map((mtb, index) => (
              <div
                key={mtb.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`transition-all duration-200 ${
                  dragOverIndex === index ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                style={{ cursor: draggedIndex !== null ? 'grabbing' : 'grab' }}
              >
                <MTBCard mtb={mtb} isDragging={draggedIndex === index} />
              </div>
            ))}
          </div>

          {displayedMTBs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No {activeTab === 'my' ? 'owned' : 'enrolled'} MTBs found
            </div>
          )}
        </div>
      </main>

      {/* Create MTB Modal */}
      <CreateMTBModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateMTB={handleCreateMTB}
      />
    </div>
  );
};

export default MTBsList;

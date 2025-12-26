import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import CaseTable from '@/components/CaseTable';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Skeleton } from '@/components/ui/skeleton';

const CasesList = () => {
  const navigate = useNavigate();
  const { cases, loading, deleteCase } = useSupabaseData();

  // Sort cases by created date descending (newest first)
  const sortedCases = [...cases].sort((a, b) => {
    const dateA = new Date(a.createdDate).getTime();
    const dateB = new Date(b.createdDate).getTime();
    return dateB - dateA;
  });

  if (loading) {
    return (
      <div className="h-screen bg-muted flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-4">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-muted flex flex-col overflow-hidden">
      <Header />
      
      <main className="flex-1 overflow-hidden flex flex-col">
        <CaseTable 
          cases={sortedCases} 
          title="My Cases" 
          showBackButton
          onBack={() => navigate(-1)}
          onDeleteCase={deleteCase}
        />
      </main>
    </div>
  );
};

export default CasesList;

import { Eye, Search, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Case, formatDate } from '@/lib/storage';
import ConfirmModal from '@/components/ConfirmModal';
import type { FullCase } from '@/hooks/useSupabaseData';

interface CaseTableProps {
  cases: (Case | FullCase)[];
  title: string;
  basePath?: string;
  showActions?: 'all' | 'view-only';
  showBackButton?: boolean;
  onBack?: () => void;
  onEditCase?: (caseId: string) => void;
  onDeleteCase?: (caseId: string) => Promise<boolean>;
  showPatientName?: boolean;
  hideTitle?: boolean;
}

const CaseTable = ({ 
  cases, 
  title, 
  basePath = '/cases',
  showActions = 'all',
  showBackButton = false,
  onBack,
  onEditCase,
  onDeleteCase,
  showPatientName = true,
  hideTitle = false
}: CaseTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<Case | FullCase | null>(null);
  const navigate = useNavigate();

  const filteredCases = cases.filter(c =>
    c.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.caseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.patient.cancerType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = (caseId: string) => {
    navigate(`${basePath}/${caseId}`);
  };

  const handleEdit = (caseItem: Case | FullCase) => {
    navigate(`/cases/${caseItem.id}/edit`);
    onEditCase?.(caseItem.id);
  };

  const handleDeleteClick = (caseItem: Case | FullCase) => {
    setCaseToDelete(caseItem);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (caseToDelete) {
      if (onDeleteCase) {
        await onDeleteCase(caseToDelete.id);
      }
    }
    setDeleteModalOpen(false);
    setCaseToDelete(null);
  };

  return (
    <>
      <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-2 sm:px-4 pb-4">
        {/* Header Row */}
        <div className="flex items-center gap-2 sm:gap-4 py-2 sm:py-4">
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-muted rounded-full transition-colors"
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          {!hideTitle && (
            <h2 className="text-lg sm:text-xl font-semibold text-foreground flex-1">{title}</h2>
          )}
          <div className="relative ml-auto">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-2 py-1.5 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 w-32 sm:w-48 text-sm"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto scrollbar-hide rounded-lg border border-border bg-card">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 z-10">
              <tr>
                {showPatientName && (
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Patient</th>
                )}
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Case Name</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden sm:table-cell">Cancer Type</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden md:table-cell">Status</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden lg:table-cell">Created</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={showPatientName ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    No cases found
                  </td>
                </tr>
              ) : (
                filteredCases.map(caseItem => (
                  <tr
                    key={caseItem.id}
                    className="border-t border-border hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => handleView(caseItem.id)}
                  >
                    {showPatientName && (
                      <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">
                        {caseItem.patient.name}
                      </td>
                    )}
                    <td className="px-3 py-2 text-foreground whitespace-nowrap">{caseItem.caseName}</td>
                    <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                      {caseItem.patient.cancerType || '-'}
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium
                        ${caseItem.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${caseItem.status === 'In Review' ? 'bg-blue-100 text-blue-800' : ''}
                        ${caseItem.status === 'Completed' ? 'bg-green-100 text-green-800' : ''}
                      `}>
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                      {formatDate(caseItem.createdDate)}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleView(caseItem.id)}
                          className="p-1.5 hover:bg-primary/10 rounded transition-colors"
                          title="View"
                          aria-label="View case"
                        >
                          <Eye className="w-4 h-4 text-primary" />
                        </button>
                        {showActions === 'all' && (
                          <>
                            <button
                              onClick={() => handleEdit(caseItem)}
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              title="Edit"
                              aria-label="Edit case"
                            >
                              <Pencil className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(caseItem)}
                              className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
                              title="Delete"
                              aria-label="Delete case"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Case"
        description={`Are you sure you want to delete the case for ${caseToDelete?.patient.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        destructive
      />
    </>
  );
};

export default CaseTable;

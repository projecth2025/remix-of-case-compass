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
  showActions?: 'all' | 'view-only'; // 'all' for My Cases, 'view-only' for Shared Cases
  showBackButton?: boolean;
  onBack?: () => void;
  onEditCase?: (caseId: string) => void;
  onDeleteCase?: (caseId: string) => Promise<boolean>; // Supabase delete handler
  showPatientName?: boolean; // If false, show case name in second column instead
  hideTitle?: boolean; // If true, hide the card title
}

/**
 * CaseTable with View/Edit/Delete actions
 * - View (green eye icon): Navigate to CaseView
 * - Edit (blue pencil icon): Navigate to file preview/digitization page
 * - Delete (red trash icon): Show confirmation modal and delete
 * - Shared Cases only show View icon
 */
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
    // Navigate to the dedicated EditCase page with the case ID
    navigate(`/cases/${caseItem.id}/edit`);
    onEditCase?.(caseItem.id);
  };

  const handleDeleteClick = (caseItem: Case | FullCase) => {
    setCaseToDelete(caseItem);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (caseToDelete) {
      // Use Supabase delete if provided
      if (onDeleteCase) {
        await onDeleteCase(caseToDelete.id);
      }
    }
    setDeleteModalOpen(false);
    setCaseToDelete(null);
  };

  return (
    <>
      <div className="flex flex-col h-full w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="vmtb-card p-6 animate-fade-in flex flex-col flex-1 overflow-hidden">
          {!hideTitle && (
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h2 className="text-xl font-semibold text-foreground">
                {title}
              </h2>
              <div className="flex items-center gap-3">
                {showBackButton && onBack && (
                  <button
                    onClick={onBack}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Go back"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}
          {hideTitle && (
            <div className="flex items-center justify-end mb-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                {showBackButton && onBack && (
                  <button
                    onClick={onBack}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Go back"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Single table with fixed header and scrollable body */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 scrollbar-hide">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Case Name</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">{showPatientName ? 'Patient Name' : 'Case Name'}</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Patient Info</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cancer Type</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Created Date</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCases.map(caseItem => (
                    <tr key={caseItem.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4 text-foreground font-medium">{caseItem.caseName}</td>
                      <td className="py-4 px-4 text-foreground">{showPatientName ? caseItem.patient.name : caseItem.caseName}</td>
                      <td className="py-4 px-4 text-foreground">
                        {caseItem.patient.age}y, {caseItem.patient.sex.charAt(0).toUpperCase()}
                      </td>
                      <td className="py-4 px-4 text-foreground">{caseItem.patient.cancerType}</td>
                      <td className="py-4 px-4 text-foreground">{caseItem.status}</td>
                      <td className="py-4 px-4 text-foreground">{formatDate(caseItem.createdDate)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {/* View Icon - Green */}
                          <button
                            onClick={() => handleView(caseItem.id)}
                            className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                            title="View Case"
                            aria-label="View case"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {showActions === 'all' && (
                            <>
                              {/* Edit Icon - Blue */}
                              <button
                                onClick={() => handleEdit(caseItem)}
                                className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors"
                                title="Edit Case"
                                aria-label="Edit case"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              {/* Delete Icon - Red */}
                              <button
                                onClick={() => handleDeleteClick(caseItem)}
                                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                                title="Delete Case"
                                aria-label="Delete case"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCases.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No cases found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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

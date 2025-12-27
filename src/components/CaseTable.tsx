import { Eye, Search, Pencil, Trash2, ArrowLeft, FileText, User, Activity, Calendar, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Case, formatDate } from '@/lib/storage';
import ConfirmModal from '@/components/ConfirmModal';
import type { FullCase } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

/**
 * CaseTable with professional infographic-style layout for clinical workflows
 * Clean, minimal, data-focused design with card-based case display
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'in review':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <>
      <div className="flex flex-col h-full w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
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
            {!hideTitle && (
              <div>
                <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'} available
                </p>
              </div>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
            />
          </div>
        </div>

        {/* Cases Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No cases found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchTerm ? 'Try adjusting your search terms' : 'Cases will appear here once created'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCases.map(caseItem => (
                <div
                  key={caseItem.id}
                  className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => handleView(caseItem.id)}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {caseItem.caseName}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {caseItem.patient.cancerType || 'Cancer type not specified'}
                      </p>
                    </div>
                    
                    {showActions === 'all' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="p-1.5 hover:bg-muted rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => handleView(caseItem.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(caseItem)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit Case
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(caseItem)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Case
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Patient Info */}
                  <div className="flex items-center gap-4 mb-4 py-3 px-4 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {showPatientName ? caseItem.patient.name : caseItem.caseName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {caseItem.patient.age}y • {caseItem.patient.sex.charAt(0).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Status and Date */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(caseItem.status)} font-medium`}
                    >
                      <Activity className="w-3 h-3 mr-1" />
                      {caseItem.status}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(caseItem.createdDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, Folder, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCasesStore } from '@/stores/casesStore';
import type { CancerType, CaseStatus } from '@/types/vmtb';

const cancerTypeLabels: Record<CancerType, string> = {
  breast: 'Breast',
  lung: 'Lung',
  colorectal: 'Colorectal',
  prostate: 'Prostate',
  melanoma: 'Melanoma',
  leukemia: 'Leukemia',
  lymphoma: 'Lymphoma',
  pancreatic: 'Pancreatic',
  ovarian: 'Ovarian',
  bladder: 'Bladder',
  kidney: 'Kidney',
  thyroid: 'Thyroid',
  liver: 'Liver',
  brain: 'Brain',
  other: 'Other',
};

const statusColors: Record<CaseStatus, string> = {
  active: 'bg-success/10 text-success',
  draft: 'bg-warning/10 text-warning',
  archived: 'bg-muted text-muted-foreground',
};

export function CasesPage() {
  const { cases, patients, loadMockData } = useCasesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancerFilter, setCancerFilter] = useState<string>('all');

  useEffect(() => {
    loadMockData();
  }, [loadMockData]);

  const filteredCases = cases.filter((c) => {
    const matchesSearch = 
      c.caseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesCancer = cancerFilter === 'all' || c.cancerType === cancerFilter;
    return matchesSearch && matchesStatus && matchesCancer;
  });

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cases</h1>
            <p className="text-muted-foreground mt-1">
              Manage and review cancer cases
            </p>
          </div>
          <Link to="/create-case">
            <Button className="gap-2 shadow-glow">
              <Plus className="h-4 w-4" />
              New Case
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cancerFilter} onValueChange={setCancerFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Cancer Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(cancerTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cases Grid */}
        {filteredCases.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCases.map((caseItem, index) => {
              const patient = patients.get(caseItem.patientId);
              return (
                <Link
                  key={caseItem.id}
                  to={`/cases/${caseItem.id}`}
                  className="medical-card hover:border-primary/50 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${(index + 1) * 50}ms` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[caseItem.status]}`}>
                      {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(caseItem.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {caseItem.caseName}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {cancerTypeLabels[caseItem.cancerType]}
                    </span>
                    {patient && (
                      <span className="text-xs text-muted-foreground">
                        {patient.displayName} • {patient.age}y • {patient.sex.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {caseItem.notes || 'No clinical notes available'}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Folder className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No cases found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== 'all' || cancerFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first case'}
            </p>
            {!searchQuery && statusFilter === 'all' && cancerFilter === 'all' && (
              <Link to="/create-case">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Case
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

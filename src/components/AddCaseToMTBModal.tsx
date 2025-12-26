import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useSupabaseData, FullCase } from '@/hooks/useSupabaseData';

interface AddCaseToMTBModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCases: (caseIds: string[]) => void;
}

/**
 * Modal for adding cases to an MTB
 * - Case search with autocomplete
 * - Gmail-style chip system for selected cases
 * - Shows case name, patient name, and cancer type in suggestions
 */
const AddCaseToMTBModal = ({ open, onOpenChange, onAddCases }: AddCaseToMTBModalProps) => {
  const { cases } = useSupabaseData();
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [caseInput, setCaseInput] = useState('');
  const [caseSuggestions, setCaseSuggestions] = useState<FullCase[]>([]);

  // Get user's cases
  const userCases = cases;

  const handleCaseInputChange = (value: string) => {
    setCaseInput(value);
    if (value.trim()) {
      const suggestions = userCases.filter(
        caseItem =>
          (caseItem.caseName.toLowerCase().includes(value.toLowerCase()) ||
            caseItem.patient.name.toLowerCase().includes(value.toLowerCase())) &&
          !selectedCases.includes(caseItem.id)
      );
      setCaseSuggestions(suggestions);
    } else {
      setCaseSuggestions([]);
    }
  };

  const addCase = (caseId: string) => {
    const caseItem = userCases.find(c => c.id === caseId);
    if (caseItem && !selectedCases.includes(caseId)) {
      setSelectedCases([...selectedCases, caseId]);
    }
    setCaseInput('');
    setCaseSuggestions([]);
  };

  const removeCase = (caseId: string) => {
    setSelectedCases(selectedCases.filter(id => id !== caseId));
  };

  const handleCaseKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && caseSuggestions.length > 0) {
      e.preventDefault();
      addCase(caseSuggestions[0].id);
    } else if (e.key === 'Backspace' && !caseInput && selectedCases.length > 0) {
      setSelectedCases(selectedCases.slice(0, -1));
    }
  };

  const handleAdd = () => {
    if (selectedCases.length > 0) {
      onAddCases(selectedCases);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setSelectedCases([]);
    setCaseInput('');
    setCaseSuggestions([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Cases to MTB</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Case Search Input */}
          <div className="space-y-2">
            <Label>Search Cases</Label>
            <div className="relative">
              <div className="min-h-[42px] p-2 border border-input rounded-md bg-background flex flex-wrap gap-1 items-center">
                {selectedCases.map(caseId => {
                  const caseItem = userCases.find(c => c.id === caseId);
                  return caseItem ? (
                    <span
                      key={caseId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {caseItem.caseName}
                      <button
                        type="button"
                        onClick={() => removeCase(caseId)}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : null;
                })}
                <input
                  type="text"
                  value={caseInput}
                  onChange={e => handleCaseInputChange(e.target.value)}
                  onKeyDown={handleCaseKeyDown}
                  placeholder={selectedCases.length === 0 ? 'Search cases by name or patient...' : ''}
                  className="flex-1 min-w-[150px] bg-transparent border-none outline-none text-sm"
                  autoFocus
                />
              </div>
              {/* Case Suggestions dropdown */}
              {caseSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {caseSuggestions.map(caseItem => (
                    <button
                      key={caseItem.id}
                      type="button"
                      onClick={() => addCase(caseItem.id)}
                      className="group w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                    >
                      <div className="font-medium text-sm group-hover:text-white">
                        {caseItem.caseName}
                      </div>
                      <div className="text-xs text-muted-foreground group-hover:text-white/80">
                        {caseItem.patient.name} - {caseItem.patient.cancerType}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Type to search cases, press Enter to add, or click a suggestion
            </p>
          </div>

          {userCases.length === 0 && (
            <p className="text-sm text-muted-foreground py-2 text-center">
              No cases available. Create cases first to add them to this MTB.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={selectedCases.length === 0}>
            <Plus className="w-4 h-4 mr-1" />
            Add Cases ({selectedCases.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCaseToMTBModal;

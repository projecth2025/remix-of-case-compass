import { useState, useRef } from 'react';
import { X, Upload, User, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseData, FullCase } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateMTBModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateMTB: (data: {
    name: string;
    dpImage: string | null;
    expertEmails: string[];
    caseIds: string[];
  }) => void;
}

/**
 * Modal for creating a new MTB with:
 * - MTB Name input
 * - Display Picture upload or use profile picture
 * - Gmail-style expert email input with chips
 * - Multi-select cases
 */
const CreateMTBModal = ({ open, onOpenChange, onCreateMTB }: CreateMTBModalProps) => {
  const { cases } = useSupabaseData();
  const { profile } = useAuth();
  const [mtbName, setMtbName] = useState('');
  const [dpImage, setDpImage] = useState<string | null>(null);
  const [expertEmails, setExpertEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [caseInput, setCaseInput] = useState('');
  const [caseSuggestions, setCaseSuggestions] = useState<FullCase[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get all user cases for suggestions
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

  const handleEmailInputChange = async (value: string) => {
    setEmailInput(value);
    
    // Search for email suggestions from profiles when at least 2 characters are typed
    if (value.trim().length >= 2) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .ilike('email', `%${value}%`)
          .neq('id', profile?.id || '') // Exclude current user
          .limit(5);
        
        if (!error && data) {
          // Filter out already added emails
          const suggestions = data
            .map(p => p.email)
            .filter(email => !expertEmails.includes(email));
          setEmailSuggestions(suggestions);
        }
      } catch (err) {
        console.error('Error fetching email suggestions:', err);
        setEmailSuggestions([]);
      }
    } else {
      setEmailSuggestions([]);
    }
  };

  const addExpertEmail = async (email: string) => {
    if (!email || expertEmails.includes(email)) {
      setEmailInput('');
      setEmailSuggestions([]);
      return;
    }

    // Check if user exists in database
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (!existingProfile) {
        toast.error(`User "${email}" is not registered`);
        return;
      }

      setExpertEmails([...expertEmails, email]);
      setEmailInput('');
      setEmailSuggestions([]);
    } catch (err) {
      console.error('Error checking email:', err);
      toast.error('Failed to verify email');
    }
  };

  const removeExpertEmail = (email: string) => {
    setExpertEmails(expertEmails.filter(e => e !== email));
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && emailInput.trim()) {
      e.preventDefault();
      // Add the email if it looks valid
      if (emailInput.includes('@')) {
        await addExpertEmail(emailInput.trim());
      }
    } else if (e.key === 'Backspace' && !emailInput && expertEmails.length > 0) {
      // Remove last chip on backspace
      setExpertEmails(expertEmails.slice(0, -1));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setDpImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const useProfilePicture = () => {
    if (profile?.avatar_url) {
      setDpImage(profile.avatar_url);
    }
  };

  const handleCreate = () => {
    if (!mtbName.trim()) return;

    onCreateMTB({
      name: mtbName.trim(),
      dpImage,
      expertEmails,
      caseIds: selectedCases,
    });

    // Reset form
    setMtbName('');
    setDpImage(null);
    setExpertEmails([]);
    setSelectedCases([]);
    onOpenChange(false);
  };

  const resetAndClose = () => {
    setMtbName('');
    setDpImage(null);
    setExpertEmails([]);
    setEmailInput('');
    setSelectedCases([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New MTB</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* MTB Name */}
          <div className="space-y-2">
            <Label htmlFor="mtb-name">MTB Name</Label>
            <Input
              id="mtb-name"
              value={mtbName}
              onChange={e => setMtbName(e.target.value)}
              placeholder="Enter MTB name"
            />
          </div>

          {/* MTB Display Picture */}
          <div className="space-y-2">
            <Label>MTB Display Picture</Label>
            <div className="flex items-center gap-3">
              {dpImage ? (
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-border">
                  <img src={dpImage} alt="MTB DP" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setDpImage(null)}
                    className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Upload Image
                </Button>
                {profile?.avatar_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={useProfilePicture}
                  >
                    Use My Profile Picture
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          {/* Add Experts - Gmail style */}
          <div className="space-y-2">
            <Label>Add Experts (Invite by Email)</Label>
            <div className="relative">
              <div className="min-h-[42px] p-2 border border-input rounded-md bg-background flex flex-wrap gap-1 items-center">
                {expertEmails.map(email => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeExpertEmail(email)}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => handleEmailInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={expertEmails.length === 0 ? 'Type email to invite...' : ''}
                  className="flex-1 min-w-[150px] bg-transparent border-none outline-none text-sm"
                />
              </div>
              {/* Suggestions dropdown */}
              {emailSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {emailSuggestions.map(email => (
                    <button
                      key={email}
                      type="button"
                      onClick={() => addExpertEmail(email)}
                      className="group w-full px-3 py-2 text-left hover:bg-accent text-sm transition-colors group-hover:text-white"
                    >
                      {email}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Type an email and press Enter or select from suggestions
            </p>
          </div>

          {/* Add Cases - Gmail style search */}
          <div className="space-y-2">
            <Label>Add Cases</Label>
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
                  placeholder={selectedCases.length === 0 ? 'Search cases...' : ''}
                  className="flex-1 min-w-[150px] bg-transparent border-none outline-none text-sm"
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
            {userCases.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
                No cases available. Create cases first to add them to this MTB.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!mtbName.trim()}>
            <Plus className="w-4 h-4 mr-1" />
            Create MTB
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMTBModal;

import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

interface ExpertToAdd {
  email: string;
  name?: string;
  id?: string;
}

interface AddExpertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (email: string) => void;
  ownerEmail?: string;
}

/**
 * AddExpertModal allows MTB owners to invite multiple experts by email with autocomplete suggestions.
 */
const AddExpertModal = ({ open, onOpenChange, onAdd, ownerEmail }: AddExpertModalProps) => {
  const { profile } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuggestions, setEmailSuggestions] = useState<{ email: string; name: string; id: string }[]>([]);
  const [selectedExperts, setSelectedExperts] = useState<ExpertToAdd[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentUserEmail = ownerEmail || profile?.email;

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailChange = async (value: string) => {
    setEmail(value);
    setEmailError('');
    
    // Search for email suggestions from profiles when at least 2 characters are typed
    if (value.trim().length >= 2) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, name')
          .or(`email.ilike.%${value}%,name.ilike.%${value}%`)
          .neq('id', profile?.id || '') // Exclude current user
          .limit(5);
        
        if (!error && data) {
          // Filter out owner's email and already selected experts
          const suggestions = data
            .filter(p => p.email !== currentUserEmail)
            .filter(p => !selectedExperts.some(e => e.email === p.email))
            .map(p => ({ email: p.email, name: p.name, id: p.id }));
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

  const selectSuggestion = (suggestion: { email: string; name: string; id: string }) => {
    // Add to selected experts if not already added
    if (!selectedExperts.some(e => e.email === suggestion.email)) {
      setSelectedExperts(prev => [...prev, { 
        email: suggestion.email, 
        name: suggestion.name,
        id: suggestion.id 
      }]);
    }
    setEmail('');
    setEmailSuggestions([]);
    setEmailError('');
  };

  const addEmailManually = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) return;
    
    if (!validateEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Check if trying to add self
    if (currentUserEmail && trimmedEmail === currentUserEmail.toLowerCase()) {
      setEmailError('You cannot invite yourself to the MTB');
      return;
    }

    // Check if already added
    if (selectedExperts.some(e => e.email === trimmedEmail)) {
      setEmailError('This expert is already added');
      return;
    }

    // Verify user exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('email', trimmedEmail)
      .maybeSingle();

    if (!existingProfile) {
      setEmailError('This user is not registered on vMTB');
      return;
    }

    setSelectedExperts(prev => [...prev, { 
      email: trimmedEmail, 
      name: existingProfile.name,
      id: existingProfile.id 
    }]);
    setEmail('');
    setEmailError('');
    setEmailSuggestions([]);
  };

  const removeExpert = (emailToRemove: string) => {
    setSelectedExperts(prev => prev.filter(e => e.email !== emailToRemove));
  };

  const handleSendInvitations = async () => {
    if (selectedExperts.length === 0) {
      setEmailError('Please add at least one expert');
      return;
    }

    setIsLoading(true);

    try {
      // Send invitations for each selected expert
      for (const expert of selectedExperts) {
        await onAdd(expert.email);
      }
      
      toast.success(`${selectedExperts.length} invitation${selectedExperts.length > 1 ? 's' : ''} sent`);
      handleClose();
    } catch (err) {
      console.error('Error sending invitations:', err);
      toast.error('Failed to send invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailError('');
    setEmailSuggestions([]);
    setSelectedExperts([]);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (emailSuggestions.length > 0) {
        selectSuggestion(emailSuggestions[0]);
      } else if (email.trim()) {
        addEmailManually();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Experts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Selected Experts */}
          {selectedExperts.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Selected Experts ({selectedExperts.length})
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg max-h-32 overflow-y-auto">
                {selectedExperts.map(expert => (
                  <Badge
                    key={expert.email}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1 py-1.5"
                  >
                    <span className="max-w-[180px] truncate">
                      {expert.name || expert.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeExpert(expert.email)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="relative">
            <label className="block text-sm font-medium text-foreground mb-2">
              Search Experts
            </label>
            <input
              type="email"
              value={email}
              onChange={e => handleEmailChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`vmtb-input ${emailError ? 'border-destructive' : ''}`}
              placeholder="Search by name or email..."
            />
            {emailError && (
              <p className="text-xs text-destructive mt-1">{emailError}</p>
            )}
            
            {/* Email Suggestions Dropdown */}
            {emailSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {emailSuggestions.map(suggestion => (
                  <button
                    key={suggestion.email}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{suggestion.name}</span>
                      <span className="text-xs text-muted-foreground">{suggestion.email}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Search for registered users by name or email. Press Enter to add.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={handleClose} className="vmtb-btn-outline">
            Cancel
          </button>
          <button 
            onClick={handleSendInvitations} 
            className="vmtb-btn-primary" 
            disabled={isLoading || selectedExperts.length === 0}
          >
            {isLoading ? 'Sending...' : `Send ${selectedExperts.length > 0 ? `(${selectedExperts.length})` : ''} Invitation${selectedExperts.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpertModal;

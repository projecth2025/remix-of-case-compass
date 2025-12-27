import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AddExpertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (email: string) => void;
  ownerEmail?: string;
}

/**
 * AddExpertModal allows MTB owners to invite new experts by email with autocomplete suggestions.
 */
const AddExpertModal = ({ open, onOpenChange, onAdd, ownerEmail }: AddExpertModalProps) => {
  const { profile } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
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
          .select('email')
          .ilike('email', `%${value}%`)
          .neq('id', profile?.id || '') // Exclude current user
          .limit(5);
        
        if (!error && data) {
          // Filter out owner's email
          const suggestions = data
            .map(p => p.email)
            .filter(e => e !== currentUserEmail);
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

  const selectSuggestion = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setEmailSuggestions([]);
    setEmailError('');
  };

  const handleAdd = async () => {
    setEmailError('');
    
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      setEmailError('Email is required');
      return;
    }
    
    if (!validateEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Check if trying to invite self
    if (currentUserEmail && trimmedEmail === currentUserEmail.toLowerCase()) {
      setEmailError('You cannot invite yourself to the MTB');
      toast.error('You cannot invite yourself to the MTB');
      return;
    }

    setIsLoading(true);

    try {
      // Verify user exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (!existingProfile) {
        setEmailError('This user is not registered on vMTB');
        setIsLoading(false);
        return;
      }

      onAdd(trimmedEmail);
      toast.success('Expert invitation sent');
      setEmail('');
      setEmailError('');
      setEmailSuggestions([]);
      onOpenChange(false);
    } catch (err) {
      console.error('Error checking email:', err);
      toast.error('Failed to verify email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailError('');
    setEmailSuggestions([]);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (emailSuggestions.length > 0) {
        selectSuggestion(emailSuggestions[0]);
      } else {
        handleAdd();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Expert</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative">
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => handleEmailChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`vmtb-input ${emailError ? 'border-destructive' : ''}`}
              placeholder="Search by email..."
            />
            {emailError && (
              <p className="text-xs text-destructive mt-1">{emailError}</p>
            )}
            
            {/* Email Suggestions Dropdown */}
            {emailSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                {emailSuggestions.map(suggestionEmail => (
                  <button
                    key={suggestionEmail}
                    type="button"
                    onClick={() => selectSuggestion(suggestionEmail)}
                    className="w-full px-3 py-2 text-left hover:bg-accent text-sm transition-colors"
                  >
                    {suggestionEmail}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Type to search for registered users by email
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={handleClose} className="vmtb-btn-outline">
            Cancel
          </button>
          <button onClick={handleAdd} className="vmtb-btn-primary" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpertModal;

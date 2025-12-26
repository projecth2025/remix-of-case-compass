import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { User } from 'lucide-react';
import ProfessionSelect from '@/components/ProfessionSelect';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * EditProfileModal allows users to update their profile information.
 * Uses Supabase for profile updates.
 */
const EditProfileModal = ({ open, onOpenChange }: EditProfileModalProps) => {
  const { profile, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      // These fields would come from extended profile if available
      setProfession((profile as any).profession || '');
      setHospitalName((profile as any).hospital_name || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setLoading(true);
    const { error } = await updateProfile({
      name: name.trim(),
      phone: phone.trim() || null,
      profession: profession.trim() || null,
      hospital_name: hospitalName.trim() || null,
    });

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Profile Picture Preview */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-primary" />
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="vmtb-input"
              placeholder="Your name"
            />
          </div>

          {/* Profession */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Profession
            </label>
            <ProfessionSelect
              value={profession}
              onChange={setProfession}
              placeholder="Select or type your profession"
            />
          </div>

          {/* Hospital Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Hospital Name
            </label>
            <input
              type="text"
              value={hospitalName}
              onChange={e => setHospitalName(e.target.value)}
              className="vmtb-input"
              placeholder="Your hospital name"
            />
          </div>
          
          {/* Email - Read Only */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="vmtb-input opacity-50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>
          
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="vmtb-input"
              placeholder="Phone number"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="vmtb-btn-outline"
          >
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} className="vmtb-btn-primary">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { User, Camera, Loader2 } from 'lucide-react';
import ProfessionSelect from '@/components/ProfessionSelect';
import { supabase } from '@/integrations/supabase/client';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * EditProfileModal allows users to update their profile information.
 * Uses Supabase for profile updates including avatar upload.
 */
const EditProfileModal = ({ open, onOpenChange }: EditProfileModalProps) => {
  const { profile, updateProfile, user } = useAuth();
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setProfession(profile.profession || '');
      setHospitalName(profile.hospital_name || '');
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache buster to force refresh
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(urlWithCacheBuster);

      toast.success('Avatar uploaded successfully');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
      avatar_url: avatarUrl,
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
          {/* Profile Picture Preview with Upload */}
          <div className="flex justify-center">
            <div 
              className="relative w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden cursor-pointer group"
              onClick={handleAvatarClick}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-primary" />
              )}
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar ? (
                  <Loader2 size={24} className="text-white animate-spin" />
                ) : (
                  <Camera size={24} className="text-white" />
                )}
              </div>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground">Click to change profile picture</p>

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
          <button onClick={handleSave} disabled={loading || uploadingAvatar} className="vmtb-btn-primary">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;

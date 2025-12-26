import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import ProfessionSelect from '@/components/ProfessionSelect';

const Signup = () => {
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { signup } = useApp();
  const navigate = useNavigate();

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only PNG, JPG, and JPEG formats are supported');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setProfilePicture(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mandatory fields
    if (!name || !profession || !email || !password || !confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (signup({ name, email, phone, password, profilePicture, profession, hospitalName })) {
      toast.success('Account created! Please verify your email.');
      navigate('/otp');
    } else {
      toast.error('An account with this email already exists');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-t from-primary to-primary/60 relative">
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-primary/80 to-transparent rounded-b-full" />
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-sky-300 rounded-full opacity-80" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-1">Join the vMTB platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="vmtb-card p-8 space-y-5">
          {/* Name - Mandatory */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="vmtb-input"
              placeholder="Enter your full name"
            />
          </div>

          {/* Profession - Mandatory */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Profession <span className="text-destructive">*</span>
            </label>
            <ProfessionSelect
              value={profession}
              onChange={setProfession}
              placeholder="Select or type your profession"
            />
          </div>

          {/* Email - Mandatory */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="vmtb-input"
              placeholder="Enter your email"
            />
          </div>

          {/* Hospital Name - Optional */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Hospital Name <span className="text-muted-foreground text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              value={hospitalName}
              onChange={e => setHospitalName(e.target.value)}
              className="vmtb-input"
              placeholder="Enter your hospital name"
            />
          </div>

          {/* Phone - Optional */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Phone Number <span className="text-muted-foreground text-xs">(Optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="vmtb-input"
              placeholder="Enter your phone number"
            />
          </div>

          {/* Password - Mandatory */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Password <span className="text-destructive">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="vmtb-input"
              placeholder="Create a password"
            />
          </div>

          {/* Confirm Password - Mandatory */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Confirm Password <span className="text-destructive">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="vmtb-input"
              placeholder="Confirm your password"
            />
          </div>

          {/* Profile Picture Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Profile Picture</label>
            {profilePicture ? (
              <div className="flex items-center gap-3">
                <img
                  src={profilePicture}
                  alt="Profile preview"
                  className="w-16 h-16 rounded-full object-cover border border-border"
                />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="vmtb-btn-outline text-xs px-3 py-1"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveProfilePicture}
                    className="vmtb-btn-outline text-xs px-3 py-1 text-destructive border-destructive"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-border rounded-lg p-6 hover:bg-muted transition-colors flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload profile picture</span>
                <span className="text-xs text-muted-foreground">(PNG, JPG, JPEG)</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={handleProfilePictureChange}
              className="hidden"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full vmtb-btn-primary"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="vmtb-link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;

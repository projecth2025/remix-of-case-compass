import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import ProfessionSelect from '@/components/ProfessionSelect';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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

    if (!acceptedTerms) {
      toast.error('Please accept the Terms and Conditions');
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
      <div className="w-full max-w-5xl animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6">
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
        <form onSubmit={handleSubmit} className="vmtb-card p-6 space-y-4">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Name - Mandatory */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
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
              <label className="block text-sm font-medium text-foreground mb-1.5">
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
              <label className="block text-sm font-medium text-foreground mb-1.5">
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
              <label className="block text-sm font-medium text-foreground mb-1.5">
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
              <label className="block text-sm font-medium text-foreground mb-1.5">
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
              <label className="block text-sm font-medium text-foreground mb-1.5">
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
              <label className="block text-sm font-medium text-foreground mb-1.5">
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

            {/* Profile Picture Upload - Spans both columns on larger screens */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">Profile Picture</label>
              {profilePicture ? (
                <div className="flex items-center gap-3">
                  <img
                    src={profilePicture}
                    alt="Profile preview"
                    className="w-16 h-16 rounded-full object-cover border border-border"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="vmtb-btn-outline text-xs px-3 py-1.5"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveProfilePicture}
                      className="vmtb-btn-outline text-xs px-3 py-1.5 text-destructive border-destructive"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-dashed border-border rounded-lg p-4 hover:bg-muted transition-colors flex flex-col items-center justify-center gap-1.5"
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload profile picture</span>
                  <span className="text-xs text-muted-foreground">(PNG, JPG, JPEG - Max 5MB)</span>
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
          </div>

          {/* Terms and Conditions Checkbox */}
          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setTermsModalOpen(true)}
                className="font-bold text-green-600 hover:text-green-700 underline"
              >
                Terms and Conditions
              </button>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full vmtb-btn-primary"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-4 text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="vmtb-link">
            Login
          </Link>
        </p>
      </div>

      {/* Terms and Conditions Modal */}
      <Dialog open={termsModalOpen} onOpenChange={setTermsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Terms and Conditions</DialogTitle>
            <DialogDescription>
              Please read these terms and conditions carefully before using the vMTB platform.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 text-sm text-foreground">
            <section>
              <h3 className="font-semibold text-lg mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By creating an account and using the Virtual Molecular Tumor Board (vMTB) platform, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">2. User Responsibilities</h3>
              <p className="text-muted-foreground mb-2">As a user of the vMTB platform, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Comply with all applicable healthcare privacy laws and regulations</li>
                <li>Use the platform only for legitimate professional purposes</li>
                <li>Respect patient confidentiality and anonymize all patient data</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">3. Privacy and Data Protection</h3>
              <p className="text-muted-foreground">
                We are committed to protecting your privacy and the privacy of patients. All data shared on the platform must be anonymized. We employ industry-standard security measures to protect your information. For more details, please refer to our Privacy Policy.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">4. Medical Disclaimer</h3>
              <p className="text-muted-foreground">
                The vMTB platform facilitates collaboration among healthcare professionals. Discussions and recommendations on this platform are for informational purposes only and should not replace professional medical judgment. All treatment decisions remain the sole responsibility of the treating physician.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">5. Intellectual Property</h3>
              <p className="text-muted-foreground">
                All content, features, and functionality of the vMTB platform are owned by us and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">6. Limitation of Liability</h3>
              <p className="text-muted-foreground">
                The platform is provided "as is" without warranties of any kind. We shall not be liable for any damages arising from the use or inability to use the platform, including but not limited to direct, indirect, incidental, or consequential damages.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">7. Account Termination</h3>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your account if you violate these terms or engage in conduct that we deem inappropriate or harmful to the platform or other users.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">8. Changes to Terms</h3>
              <p className="text-muted-foreground">
                We may update these Terms and Conditions from time to time. Continued use of the platform after changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">9. Contact Information</h3>
              <p className="text-muted-foreground">
                If you have any questions about these Terms and Conditions, please contact us at support@vmtb.com.
              </p>
            </section>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Last updated: December 27, 2025
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setTermsModalOpen(false)}
              className="vmtb-btn-outline"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                setAcceptedTerms(true);
                setTermsModalOpen(false);
              }}
              className="vmtb-btn-primary"
            >
              Accept Terms
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Signup;

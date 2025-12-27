import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
import { Upload, User, X } from 'lucide-react';
import ProfessionSelect from '@/components/ProfessionSelect';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    const emailResult = emailSchema.safeParse(trimmedEmail);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        toast.error('Please enter your name');
        return;
      }
      if (!profession.trim()) {
        toast.error('Please select or enter your profession');
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
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(trimmedEmail, password);
        if (error) {
          // Check for email not confirmed error
          if (error.message.includes('Email not confirmed')) {
            toast.error('Please verify your email before logging in');
            navigate('/verify-email');
          } else {
            toast.error(error.message.includes('Invalid login credentials') ? 'Invalid email or password' : error.message);
          }
        } else {
          toast.success('Welcome back!');
          navigate('/home');
        }
      } else {
        // For signup, we'll pass the avatar URL if uploaded
        // But first we need to create the user to get the ID
        const { error } = await signUp(trimmedEmail, password, name, profession, phone, hospitalName);
        
        if (error) {
          toast.error(error.message.includes('already registered') ? 'An account with this email already exists' : error.message);
        } else {
          // If we have an avatar, upload it after signup
          // Note: Avatar will be updated after email verification when user logs in
          toast.success('Account created! Please check your email to verify your account.');
          navigate('/verify-email');
        }
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className={`w-full ${isLogin ? 'max-w-md' : 'max-w-5xl'} animate-fade-in`}>
        <div className={`text-center ${isLogin ? 'mb-8' : 'mb-6'}`}>
          <img src="/vmtblogo.svg" alt="vMTB Logo" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-muted-foreground mt-1">{isLogin ? 'Sign in to your account' : 'Sign up to get started'}</p>
        </div>

        <form onSubmit={handleSubmit} className={`vmtb-card ${isLogin ? 'p-8 space-y-6' : 'p-6 space-y-4'}`}>
          {isLogin ? (
            // Login Form - Single Column (Original Design)
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="vmtb-input" placeholder="Enter your email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="vmtb-input" placeholder="Enter your password" />
              </div>
            </>
          ) : (
            // Signup Form - Side by Side Layout (Form Left, Photo Right)
            <div className="flex gap-8">
              {/* Left side - Form fields */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Name <span className="text-destructive">*</span></label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="vmtb-input" placeholder="Enter your name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Profession <span className="text-destructive">*</span></label>
                  <ProfessionSelect value={profession} onChange={setProfession} placeholder="Select or type profession" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email <span className="text-destructive">*</span></label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="vmtb-input" placeholder="Enter your email" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Hospital Name <span className="text-muted-foreground text-xs">(Optional)</span></label>
                  <input type="text" value={hospitalName} onChange={e => setHospitalName(e.target.value)} className="vmtb-input" placeholder="Enter your hospital name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Password <span className="text-destructive">*</span></label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="vmtb-input" placeholder="Create a password" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number <span className="text-muted-foreground text-xs">(Optional)</span></label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="vmtb-input" placeholder="Enter your phone number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password <span className="text-destructive">*</span></label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="vmtb-input" placeholder="Confirm your password" />
                </div>
              </div>

              {/* Right side - Profile Picture Upload */}
              <div className="flex flex-col items-center justify-center gap-3 px-6 border-l border-border">
                <div className="relative">
                  {avatarPreview ? (
                    <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-primary/20">
                      <img src={avatarPreview} alt="Profile preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center border-4 border-dashed border-border">
                      <User className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Upload className="w-4 h-4" />
                  {avatarPreview ? 'Change' : 'Upload Photo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <p className="text-xs text-muted-foreground">(Optional)</p>
              </div>
            </div>
          )}

          {/* Terms and Conditions Checkbox - Only for Signup */}
          {!isLogin && (
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
          )}

          <button type="submit" disabled={loading} className="w-full vmtb-btn-primary">
            {loading ? (isLogin ? 'Signing in...' : 'Creating account...') : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <p className="text-center mt-6 text-muted-foreground">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setIsLogin(!isLogin)} className="vmtb-link">{isLogin ? 'Create Account' : 'Login'}</button>
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

export default Auth;

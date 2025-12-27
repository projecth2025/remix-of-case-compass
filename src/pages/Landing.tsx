import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { FileText, Monitor, Users, Clipboard, MapPin, Mail, BookOpen } from 'lucide-react';

const Landing = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="overflow-y-auto">
      {/* Fixed Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src="/vmtblogo.svg" alt="vMTB Logo" className="w-8 h-8" />
              <span className="text-xl font-semibold text-[#219ebc]">vMTB</span>
            </div>

            {/* Right side: Navigation Links + Get Started */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-sm font-medium text-gray-700 hover:text-[#219ebc] transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm font-medium text-gray-700 hover:text-[#219ebc] transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-sm font-medium text-gray-700 hover:text-[#219ebc] transition-colors"
              >
                Contact
              </button>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 bg-[#219ebc] text-white font-medium py-2 px-4 rounded-full hover:bg-[#1a7d96] transition-all duration-300 text-sm"
              >
                Get Started
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* SECTION 1: HERO SECTION */}
      <section id="hero" className="min-h-screen w-full bg-[#8ecae6] flex items-center justify-center px-4 md:px-8 pt-20">
        <div className="w-[95%] max-w-8xl mx-auto my-8 md:my-12 h-[75vh]">
          <div className="rounded-3xl overflow-hidden h-full flex flex-row relative">
            {/* Gradient overlay spanning both columns */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#219ebc] via-[#219ebc] via-[#219ebc]/80 via-[#219ebc]/60 via-[#219ebc]/40 via-[#219ebc]/20 via-[#219ebc]/10 via-[#219ebc]/5 to-[#ffeedb]/0 z-10"></div>
            
            {/* LEFT COLUMN - TEXT CONTENT */}
            <div className="w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative z-20">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-4 leading-tight max-w-2xl">
                Collaborate with experts to accelerate precision oncology.
              </h1>
              <p className="text-lg text-white/90 mb-10 max-w-2xl">
                Our AI-driven platform anonymizes and digitizes complex cases, enabling one-click sharing, seamless expert discussion, and longitudinal outcome tracking in one unified workspace.
              </p>
              <Link 
                to="/auth" 
                className="inline-flex items-center gap-2 bg-white text-[#219ebc] font-medium py-2.5 px-5 rounded-full hover:bg-white/90 transition-all duration-300 shadow-md w-fit"
              >
                GET STARTED
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            {/* RIGHT COLUMN - IMAGE ONLY */}
            <div className=" overflow-hidden relative z-0">
              <img 
                src="/images/landing-hero.png" 
                alt="Doctors collaborating with digital medical screens" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: FEATURES & SERVICES */}
      <section id="features" className="min-h-screen w-full bg-[#219ebc] relative overflow-hidden flex items-center justify-center px-4 md:px-8 py-20">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#8ecae6]/38 via-[#8ecae6]/43 to-[#8ecae6]/88 pointer-events-none"></div>
        
        <div className="w-full max-w-6xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-white text-center mb-10">
            Our Features & Services.
          </h2>
          
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-7 shadow-lg border border-white/20">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="bg-white/20 p-5 rounded-xl flex-shrink-0 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <div className="pt-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Anonymize and Digitize patient's data</h3>
                  <p className="text-white/90">With AI, semi-automatically anonymizes and digitize unstructured reports into a visual clinical timeline.</p>
                </div>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-7 shadow-lg border border-white/20">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="bg-white/20 p-5 rounded-xl flex-shrink-0 flex items-center justify-center">
                  <Monitor className="w-10 h-10 text-white" />
                </div>
                <div className="pt-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Unified Case Dashboard</h3>
                  <p className="text-white/90">Visualize pathology, radiology, and molecular profiling on a single interactive interface—no more toggling between files.</p>
                </div>
              </div>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-7 shadow-lg border border-white/20">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="bg-white/20 p-5 rounded-xl flex-shrink-0 flex items-center justify-center">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div className="pt-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Virtual Boardroom</h3>
                  <p className="text-white/90">Host secure, multi-disciplinary meetings with integrated video, instant messaging, and one-click expert invitations.</p>
                </div>
              </div>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-7 shadow-lg border border-white/20">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="bg-white/20 p-5 rounded-xl flex-shrink-0 flex items-center justify-center">
                  <Clipboard className="w-10 h-10 text-white" />
                </div>
                <div className="pt-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Actionable Consensus</h3>
                  <p className="text-white/90">Formalize treatment plans within the platform and maintain a longitudinal record of patient follow-ups.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FOOTER SECTION */}
      <section id="contact" className="min-h-screen w-full bg-[#8ecae6] flex flex-col">
        {/* Empty top area - 80-85% */}
        <div className="flex-1"></div>
        
        {/* Footer - 15-20% */}
        <footer className="w-full bg-[#219ebc] py-8 px-6 md:px-12 lg:px-16">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            {/* Logo + Brand */}
            <div className="flex items-center gap-3">
              <img src="/vmtblogo.svg" alt="vMTB Logo" className="w-10 h-10" />
              <span className="text-2xl font-semibold text-white">vMTB</span>
            </div>
            
            {/* Address Block */}
            <div className="flex items-start gap-3 text-center md:text-left">
              <MapPin className="w-5 h-5 text-[#f4d35e] flex-shrink-0 mt-1" />
              <div>
                <p className="text-[#f4d35e] font-medium mb-1">Address</p>
                <p className="text-white text-sm leading-relaxed">
                  Indian Institute of Technology<br />
                  Jodhpur, NH 62 Nagaur Road,<br />
                  Karwar 342030, Jodhpur<br />
                  District, Rajasthan, India
                </p>
              </div>
            </div>
            
            {/* Email Block */}
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#90e0ef]" />
                <span className="text-[#90e0ef] font-medium">Email us</span>
              </div>
              <a href="mailto:projectch.startup@gmail.com" className="text-white text-sm hover:underline">
                projectch.startup@gmail.com
              </a>
              <p className="text-[#f4d35e] text-sm mt-2">
                Reach out anytime with questions or feedback.
              </p>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
};

export default Landing;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import UploadReview from "./pages/UploadReview";
import Anonymize from "./pages/Anonymize";
import FilePreview from "./pages/FilePreview";
import CasesList from "./pages/CasesList";
import CaseView from "./pages/CaseView";
import EditCase from "./pages/EditCase";
import MTBsList from "./pages/MTBsList";
import MTBDetail from "./pages/MTBDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Auth Route Component (redirect if already logged in)
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
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
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />

      {/* Protected Routes */}
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
      <Route path="/upload/review" element={<ProtectedRoute><UploadReview /></ProtectedRoute>} />
      <Route path="/upload/anonymize/:fileIndex" element={<ProtectedRoute><Anonymize /></ProtectedRoute>} />
      <Route path="/upload/preview/:fileIndex" element={<ProtectedRoute><FilePreview /></ProtectedRoute>} />
      <Route path="/cases" element={<ProtectedRoute><CasesList /></ProtectedRoute>} />
      <Route path="/cases/:id" element={<ProtectedRoute><CaseView /></ProtectedRoute>} />
      <Route path="/cases/:caseId/edit" element={<ProtectedRoute><EditCase /></ProtectedRoute>} />
      <Route path="/mtbs" element={<ProtectedRoute><MTBsList /></ProtectedRoute>} />
      <Route path="/mtbs/:id" element={<ProtectedRoute><MTBDetail /></ProtectedRoute>} />
      <Route path="/mtbs/:id/cases/:caseId" element={<ProtectedRoute><CaseView /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </TooltipProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

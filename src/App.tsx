import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { CasesPage } from "@/pages/CasesPage";
import { CaseProfilePage } from "@/pages/CaseProfilePage";
import { MTBsPage } from "@/pages/MTBsPage";
import { MTBDetailPage } from "@/pages/MTBDetailPage";
import { MetadataStep } from "@/components/create-case/MetadataStep";
import { UploadStep } from "@/components/create-case/UploadStep";
import { AnonymizationStep } from "@/components/create-case/AnonymizationStep";
import { DigitizationStep } from "@/components/create-case/DigitizationStep";
import { ReviewStep } from "@/components/create-case/ReviewStep";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/cases/:caseId" element={<CaseProfilePage />} />
            <Route path="/mtbs" element={<MTBsPage />} />
            <Route path="/mtbs/:mtbId" element={<MTBDetailPage />} />
          </Route>
          {/* Create Case Flow - Outside main layout */}
          <Route path="/create-case" element={<MetadataStep />} />
          <Route path="/create-case/upload" element={<UploadStep />} />
          <Route path="/create-case/anonymization" element={<AnonymizationStep />} />
          <Route path="/create-case/digitization" element={<DigitizationStep />} />
          <Route path="/create-case/review" element={<ReviewStep />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

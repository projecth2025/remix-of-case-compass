import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertCircle, Eye, Square, Circle, Pen, Eraser } from 'lucide-react';
import { useCreateCaseStore } from '@/stores/createCaseStore';
import { StepIndicator } from '@/components/create-case/StepIndicator';
import { ValidationPopup } from '@/components/create-case/ValidationPopup';
import { VerificationTick } from '@/components/create-case/VerificationTick';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Tool = 'view' | 'rectangle' | 'ellipse' | 'brush' | 'eraser';

const tools: { id: Tool; icon: typeof Square; label: string }[] = [
  { id: 'view', icon: Eye, label: 'View' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'ellipse', icon: Circle, label: 'Ellipse' },
  { id: 'brush', icon: Pen, label: 'Brush' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

export function AnonymizationStep() {
  const navigate = useNavigate();
  const {
    documents,
    activeDocumentId,
    setActiveDocument,
    markDocumentVisitedAnonymization,
    validateAnonymization,
    setStep,
    shakeScreen,
    triggerShake,
  } = useCreateCaseStore();

  const [selectedTool, setSelectedTool] = useState<Tool>('view');
  const [showValidationPopup, setShowValidationPopup] = useState(false);

  // Set first document as active if none selected
  useEffect(() => {
    if (documents.length > 0 && !activeDocumentId) {
      setActiveDocument(documents[0].id);
      markDocumentVisitedAnonymization(documents[0].id);
    }
  }, [documents, activeDocumentId, setActiveDocument, markDocumentVisitedAnonymization]);

  const activeDocument = documents.find((d) => d.id === activeDocumentId);

  const handleDocumentSelect = (docId: string) => {
    setActiveDocument(docId);
    markDocumentVisitedAnonymization(docId);
  };

  const handleContinue = () => {
    const result = validateAnonymization();
    if (!result.valid) {
      setShowValidationPopup(true);
      triggerShake();
      return;
    }
    setStep('digitization');
    navigate('/create-case/digitization');
  };

  const handleBack = () => {
    setStep('upload');
    navigate('/create-case/upload');
  };

  if (documents.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Documents Uploaded</h2>
          <p className="text-muted-foreground mb-4">
            Please upload documents before proceeding to anonymization.
          </p>
          <Button onClick={() => navigate('/create-case/upload')}>
            Go to Upload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-background', shakeScreen && 'shake')}>
      <StepIndicator currentStep="anonymization" completedSteps={['metadata', 'upload']} />

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Anonymize Documents
          </h1>
          <p className="text-muted-foreground">
            Review each document and mask any sensitive patient information.
          </p>
        </div>

        {/* Document Selector */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-wrap gap-2">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleDocumentSelect(doc.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200',
                  doc.id === activeDocumentId
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-card-foreground border-border hover:border-primary/50'
                )}
              >
                <span className="text-sm font-medium truncate max-w-[150px]">
                  {doc.fileName}
                </span>
                <VerificationTick
                  verified={doc.visitedInAnonymization}
                  size="sm"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="grid lg:grid-cols-[auto_1fr] gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
          {/* Toolbar */}
          <div className="lg:w-16 flex lg:flex-col gap-1 p-2 bg-card rounded-xl border border-border">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setSelectedTool(tool.id)}
                title={tool.label}
                className="w-10 h-10"
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>

          {/* Document Preview */}
          <div className="medical-card min-h-[500px] flex items-center justify-center">
            {activeDocument ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {activeDocument.fileType === 'image' ? (
                  <img
                    src={activeDocument.previewUrl}
                    alt={activeDocument.fileName}
                    className="max-w-full max-h-[500px] object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center p-8">
                    <div className="w-20 h-24 mx-auto mb-4 bg-destructive/10 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-destructive">PDF</span>
                    </div>
                    <p className="text-foreground font-medium">{activeDocument.fileName}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      PDF preview with masking tools
                    </p>
                  </div>
                )}

                {/* Masking overlay would go here in real implementation */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Canvas for drawing masks */}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Select a document to view</p>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-warning-light rounded-xl border border-warning/20 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning-foreground">Compliance Requirement</p>
              <p className="text-sm text-warning-foreground/80 mt-1">
                Every document must be reviewed. Use the masking tools to redact sensitive 
                information such as patient names, addresses, and identification numbers.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleContinue} className="gap-2">
            Continue to Digitization
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ValidationPopup
        open={showValidationPopup}
        onClose={() => setShowValidationPopup(false)}
        title="Documents Not Reviewed"
        description="Some documents have not been reviewed for anonymization."
        unverifiedDocuments={validateAnonymization().unverifiedDocuments}
      />
    </div>
  );
}

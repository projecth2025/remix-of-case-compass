import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useCreateCaseStore } from '@/stores/createCaseStore';
import { StepIndicator } from '@/components/create-case/StepIndicator';
import { ValidationPopup } from '@/components/create-case/ValidationPopup';
import { VerificationTick } from '@/components/create-case/VerificationTick';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Simulated AI extraction (would be replaced with actual API call)
const simulateDigitization = (fileName: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockTexts: Record<string, string> = {
        default: `Clinical Summary

Patient presents with abnormal findings requiring further evaluation.

Key Observations:
- Primary lesion identified
- Staging assessment pending
- Molecular markers to be determined

Recommended Actions:
1. Complete genomic profiling
2. Multidisciplinary team review
3. Treatment planning conference

This document has been digitized for tumor board review.`,
      };
      resolve(mockTexts.default);
    }, 2000);
  });
};

export function DigitizationStep() {
  const navigate = useNavigate();
  const {
    documents,
    activeDocumentId,
    setActiveDocument,
    markDocumentVisitedDigitization,
    setDocumentDigitizedText,
    validateDigitization,
    setStep,
    shakeScreen,
    triggerShake,
    isDigitizing,
    setIsDigitizing,
  } = useCreateCaseStore();

  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [localText, setLocalText] = useState('');

  const activeDocument = documents.find((d) => d.id === activeDocumentId);

  // Set first document as active if none selected
  useEffect(() => {
    if (documents.length > 0 && !activeDocumentId) {
      setActiveDocument(documents[0].id);
    }
  }, [documents, activeDocumentId, setActiveDocument]);

  // Update local text when document changes
  useEffect(() => {
    if (activeDocument) {
      setLocalText(activeDocument.digitizedText || '');
    }
  }, [activeDocument]);

  const handleDocumentSelect = async (docId: string) => {
    setActiveDocument(docId);
    markDocumentVisitedDigitization(docId);

    const doc = documents.find((d) => d.id === docId);
    if (doc && !doc.digitizedText) {
      // Auto-digitize if not already done
      setIsDigitizing(true);
      try {
        const text = await simulateDigitization(doc.fileName);
        setDocumentDigitizedText(docId, text);
        setLocalText(text);
        toast.success('Document digitized successfully');
      } catch (error) {
        toast.error('Failed to digitize document');
      } finally {
        setIsDigitizing(false);
      }
    }
  };

  const handleDigitize = async () => {
    if (!activeDocumentId) return;

    setIsDigitizing(true);
    markDocumentVisitedDigitization(activeDocumentId);

    try {
      const text = await simulateDigitization(activeDocument?.fileName || '');
      setDocumentDigitizedText(activeDocumentId, text);
      setLocalText(text);
      toast.success('Document digitized successfully');
    } catch (error) {
      toast.error('Failed to digitize document');
    } finally {
      setIsDigitizing(false);
    }
  };

  const handleTextChange = (text: string) => {
    setLocalText(text);
    if (activeDocumentId) {
      setDocumentDigitizedText(activeDocumentId, text);
    }
  };

  const handleContinue = () => {
    const result = validateDigitization();
    if (!result.valid) {
      setShowValidationPopup(true);
      triggerShake();
      return;
    }
    setStep('review');
    navigate('/create-case/review');
  };

  const handleBack = () => {
    setStep('anonymization');
    navigate('/create-case/anonymization');
  };

  if (documents.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Documents Available</h2>
          <p className="text-muted-foreground mb-4">
            Please complete the previous steps first.
          </p>
          <Button onClick={() => navigate('/create-case')}>
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-background', shakeScreen && 'shake')}>
      <StepIndicator currentStep="digitization" completedSteps={['metadata', 'upload', 'anonymization']} />

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Digitize Documents
          </h1>
          <p className="text-muted-foreground">
            AI extracts clinical text from anonymized documents. Review and edit as needed.
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
                  verified={doc.visitedInDigitization}
                  size="sm"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Split View */}
        <div className="grid lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          {/* Document Preview */}
          <div className="medical-card min-h-[450px] flex flex-col">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
              Anonymized Document
            </h3>
            <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg">
              {activeDocument ? (
                activeDocument.fileType === 'image' ? (
                  <img
                    src={activeDocument.previewUrl}
                    alt={activeDocument.fileName}
                    className="max-w-full max-h-[400px] object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center p-8">
                    <div className="w-20 h-24 mx-auto mb-4 bg-destructive/10 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-destructive">PDF</span>
                    </div>
                    <p className="text-foreground font-medium">{activeDocument.fileName}</p>
                  </div>
                )
              ) : (
                <p className="text-muted-foreground">Select a document</p>
              )}
            </div>
          </div>

          {/* Digitized Text */}
          <div className="medical-card min-h-[450px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Extracted Clinical Text
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDigitize}
                disabled={isDigitizing || !activeDocumentId}
                className="gap-2"
              >
                {isDigitizing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Digitize
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex-1 relative">
              {isDigitizing ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Extracting clinical data...</p>
                  </div>
                </div>
              ) : null}
              <Textarea
                value={localText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Click 'Digitize' to extract text from the document, or type/paste clinical notes here..."
                className="h-full min-h-[350px] resize-none font-mono text-sm"
                disabled={isDigitizing}
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleContinue} className="gap-2">
            Review & Create Case
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ValidationPopup
        open={showValidationPopup}
        onClose={() => setShowValidationPopup(false)}
        title="Documents Not Reviewed"
        description="Some documents have not been reviewed for digitization."
        unverifiedDocuments={validateDigitization().unverifiedDocuments}
      />
    </div>
  );
}

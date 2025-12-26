import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, AlertTriangle, FileText, User, Stethoscope } from 'lucide-react';
import { useCreateCaseStore } from '@/stores/createCaseStore';
import { StepIndicator } from '@/components/create-case/StepIndicator';
import { ValidationPopup } from '@/components/create-case/ValidationPopup';
import { VerificationTick } from '@/components/create-case/VerificationTick';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ReviewStep() {
  const navigate = useNavigate();
  const {
    patientMetadata,
    caseMetadata,
    documents,
    validateAll,
    shakeScreen,
    triggerShake,
    isCreating,
    setIsCreating,
    reset,
  } = useCreateCaseStore();

  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    errors: string[];
    unverifiedDocuments?: string[];
  }>({ errors: [] });

  const handleCreateCase = async () => {
    const result = validateAll();
    
    if (!result.valid) {
      setValidationResult({
        errors: result.errors,
        unverifiedDocuments: result.unverifiedDocuments,
      });
      setShowValidationPopup(true);
      triggerShake();
      return;
    }

    setIsCreating(true);

    try {
      // Simulate API call - in real implementation, this would:
      // 1. Insert case into Supabase
      // 2. Create patient record
      // 3. Upload anonymized files to storage
      // 4. Create document records
      // 5. Save digitized text
      // 6. Initialize edit-tracking metadata
      // 7. Write audit logs
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success('Case created successfully!', {
        description: `Case ${caseMetadata?.caseName} has been created.`,
      });

      // Clear all temporary state
      reset();

      // Redirect to cases list
      navigate('/cases');
    } catch (error) {
      toast.error('Failed to create case', {
        description: 'Please try again or contact support.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    navigate('/create-case/digitization');
  };

  return (
    <div className={cn('min-h-screen bg-background', shakeScreen && 'shake')}>
      <StepIndicator
        currentStep="review"
        completedSteps={['metadata', 'upload', 'anonymization', 'digitization']}
      />

      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Review & Create Case
          </h1>
          <p className="text-muted-foreground">
            Review all information before creating the case. This is the only point where data is persisted.
          </p>
        </div>

        {/* Patient Summary */}
        <div className="medical-card mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Patient Information</h2>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium text-foreground">{patientMetadata?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Age</p>
              <p className="font-medium text-foreground">{patientMetadata?.age || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sex</p>
              <p className="font-medium text-foreground capitalize">{patientMetadata?.sex || '—'}</p>
            </div>
          </div>
        </div>

        {/* Case Summary */}
        <div className="medical-card mb-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-accent/10">
              <Stethoscope className="h-5 w-5 text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Case Information</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Case Identifier</p>
              <p className="font-medium text-foreground">{caseMetadata?.caseName || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cancer Type</p>
              <p className="font-medium text-foreground capitalize">
                {caseMetadata?.cancerType?.replace(/_/g, ' ') || '—'}
              </p>
            </div>
          </div>
          
          {caseMetadata?.notes && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Clinical Notes</p>
              <p className="font-medium text-foreground mt-1">{caseMetadata.notes}</p>
            </div>
          )}
        </div>

        {/* Documents Summary */}
        <div className="medical-card mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-success/10">
              <FileText className="h-5 w-5 text-success" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Documents ({documents.length})
            </h2>
          </div>
          
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{doc.fileName}</span>
                  <span className="text-xs text-muted-foreground uppercase">
                    {doc.fileType}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">Anonymized</span>
                    <VerificationTick verified={doc.visitedInAnonymization} size="sm" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">Digitized</span>
                    <VerificationTick verified={doc.visitedInDigitization} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="p-4 bg-warning-light rounded-xl border border-warning/20 mb-8 animate-fade-in" style={{ animationDelay: '250ms' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning-foreground">Final Step</p>
              <p className="text-sm text-warning-foreground/80 mt-1">
                Clicking "Create Case" will permanently save all data to the database. 
                This action cannot be undone. Please ensure all information is correct.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between animate-fade-in" style={{ animationDelay: '300ms' }}>
          <Button variant="outline" onClick={handleBack} disabled={isCreating} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button 
            onClick={handleCreateCase} 
            disabled={isCreating}
            size="lg"
            className="gap-2 min-w-[160px]"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Create Case
              </>
            )}
          </Button>
        </div>
      </div>

      <ValidationPopup
        open={showValidationPopup}
        onClose={() => setShowValidationPopup(false)}
        title="Validation Failed"
        description="Please address the following issues before creating the case."
        unverifiedDocuments={validationResult.unverifiedDocuments}
      />
    </div>
  );
}

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, File, FileText, X, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { useCreateCaseStore } from '@/stores/createCaseStore';
import { StepIndicator } from '@/components/create-case/StepIndicator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function UploadStep() {
  const navigate = useNavigate();
  const { 
    documents, 
    addDocuments, 
    removeDocument,
    validateMetadata,
    validateDocumentsUploaded,
    setStep 
  } = useCreateCaseStore();

  // Validate metadata first
  const metadataValid = validateMetadata().valid;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((file) => {
      const isValid = 
        file.type === 'application/pdf' ||
        file.type.startsWith('image/png') ||
        file.type.startsWith('image/jpeg') ||
        file.type.startsWith('image/jpg');
      
      if (!isValid) {
        toast.error(`Invalid file type: ${file.name}`, {
          description: 'Only PNG, JPG, and PDF files are accepted.',
        });
      }
      return isValid;
    });

    if (validFiles.length > 0) {
      addDocuments(validFiles);
      toast.success(`${validFiles.length} document(s) added`);
    }
  }, [addDocuments]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });

  const handleContinue = () => {
    const result = validateDocumentsUploaded();
    if (!result.valid) {
      toast.error('Please upload at least one document');
      return;
    }
    setStep('anonymization');
    navigate('/create-case/anonymization');
  };

  const handleBack = () => {
    setStep('metadata');
    navigate('/create-case');
  };

  if (!metadataValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Missing Patient Information</h2>
          <p className="text-muted-foreground mb-4">
            Please complete the patient and case information first.
          </p>
          <Button onClick={() => navigate('/create-case')}>
            Go to Step 1
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StepIndicator currentStep="upload" completedSteps={['metadata']} />

      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Upload Medical Documents
          </h1>
          <p className="text-muted-foreground">
            Upload pathology reports, imaging scans, and other clinical documents.
          </p>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            'document-preview p-8 md:p-12 text-center cursor-pointer transition-all duration-200 animate-fade-in',
            isDragActive && 'border-primary bg-primary/5'
          )}
          style={{ animationDelay: '100ms' }}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              'p-4 rounded-full transition-colors',
              isDragActive ? 'bg-primary/10' : 'bg-muted'
            )}>
              <Upload className={cn(
                'h-8 w-8 transition-colors',
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              )} />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground mb-1">
                {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse. Supports PNG, JPG, and PDF files.
              </p>
            </div>
          </div>
        </div>

        {/* Document List */}
        {documents.length > 0 && (
          <div className="mt-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Uploaded Documents ({documents.length})
            </h2>
            <div className="grid gap-3">
              {documents.map((doc, index) => (
                <div
                  key={doc.id}
                  className="medical-card flex items-center gap-4 p-4 animate-slide-in-right"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={cn(
                    'p-2 rounded-lg',
                    doc.fileType === 'pdf' ? 'bg-destructive/10' : 'bg-primary/10'
                  )}>
                    {doc.fileType === 'pdf' ? (
                      <FileText className="h-5 w-5 text-destructive" />
                    ) : (
                      <File className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{doc.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.fileType.toUpperCase()} • {(doc.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDocument(doc.id);
                      toast.success('Document removed');
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleContinue} disabled={documents.length === 0} className="gap-2">
            Continue to Anonymization
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

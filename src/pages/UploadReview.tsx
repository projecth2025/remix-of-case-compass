import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import FileCard from '@/components/FileCard';
import ConfirmModal from '@/components/ConfirmModal';
import { useApp } from '@/contexts/AppContext';
import { UploadedFile, generateMockExtractedData } from '@/lib/storage';
import { toast } from 'sonner';

/**
 * UploadReview page with fixed footer for navigation buttons
 */
const UploadReview = () => {
  const navigate = useNavigate();
  const { currentPatient, uploadedFiles, addUploadedFile, removeUploadedFile, updateFileCategory, updateFileExtractedData, clearUploadedFiles, updateFileName } = useApp();
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = (files: UploadedFile[]) => {
    files.forEach(file => addUploadedFile(file));
    toast.success(`${files.length} file(s) added`);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const acceptedTypes = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/jpg'];

    Array.from(files).forEach(file => {
      if (acceptedTypes.includes(file.type)) {
        const reader = new FileReader();
        reader.onload = () => {
          const uploadedFile: UploadedFile = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: file.name,
            size: file.size,
            type: file.type,
            dataURL: reader.result as string,
            fileCategory: 'Clinical Notes',
          };
          addUploadedFile(uploadedFile);
        };
        reader.readAsDataURL(file);
      }
    });

    e.target.value = '';
  };

  const handleRemoveAll = () => {
    clearUploadedFiles();
    setShowConfirmRemove(false);
    toast.success('All files removed');
  };

  const handleNext = () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    uploadedFiles.forEach(file => {
      const extractedData = generateMockExtractedData(file.fileCategory);
      updateFileExtractedData(file.id, extractedData);
    });

    // Navigate to anonymization page first
    navigate('/upload/anonymize/0');
  };

  const handleBack = () => {
    navigate('/upload');
  };

  if (!currentPatient) {
    navigate('/home');
    return null;
  }

  return (
    <div className="h-screen bg-muted flex flex-col overflow-hidden">
      <Header />
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.png,.jpg,.jpeg"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Main content - fixed layout */}
      <main className="flex-1 flex flex-col overflow-hidden px-4 py-4 overscroll-y-none">
        <div className="vmtb-card p-4 md:p-6 animate-fade-in flex flex-col flex-1 overflow-hidden">
          {/* Header row - fixed */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 flex-shrink-0">
            <h2 className="text-lg font-semibold text-foreground">
              Uploaded Files ({uploadedFiles.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUploadClick}
                className="vmtb-btn-primary flex items-center gap-2 px-3 py-1.5 text-sm"
                aria-label="Upload File"
              >
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
              </button>
              <button
                onClick={() => setShowConfirmRemove(true)}
                disabled={uploadedFiles.length === 0}
                className="vmtb-btn-outline flex items-center gap-2 px-3 py-1.5 text-sm text-destructive border-destructive hover:bg-destructive/10 disabled:opacity-50"
                aria-label="Remove All"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove All</span>
              </button>
            </div>
          </div>

          {/* File List - scrollable only this area */}
          <div className="flex-1 overflow-y-auto hide-scrollbar space-y-2">
            {uploadedFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No files uploaded yet. Use the button above to upload files.
              </div>
            ) : (
              uploadedFiles.map(file => (
                <FileCard
                  key={file.id}
                  file={file}
                  isEditing={editingFileId === file.id}
                  onEditStart={() => setEditingFileId(file.id)}
                  onEditCancel={() => setEditingFileId(null)}
                  onCategoryChange={category => updateFileCategory(file.id, category)}
                  onRemove={() => removeUploadedFile(file.id)}
                  onNameChange={name => updateFileName?.(file.id, name)}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Compact fixed footer */}
      <footer className="flex-shrink-0 bg-background border-t border-border px-4 py-2 z-40">
        <div className="flex justify-between max-w-7xl mx-auto">
          <button
            onClick={handleBack}
            className="vmtb-btn-outline flex items-center gap-1.5 px-3 py-1.5 text-sm"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={uploadedFiles.length === 0}
            className="vmtb-btn-primary px-6 py-1.5 text-sm"
            aria-label="Next"
          >
            Next
          </button>
        </div>
      </footer>

      {/* Confirm Remove All Modal */}
      <ConfirmModal
        open={showConfirmRemove}
        onOpenChange={setShowConfirmRemove}
        title="Remove all uploaded files?"
        description="This action cannot be undone. All files will be permanently deleted from this upload session."
        confirmLabel="Remove All"
        onConfirm={handleRemoveAll}
        destructive
      />
    </div>
  );
};

export default UploadReview;

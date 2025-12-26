
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import Header from '@/components/Header';
import FileUploadDropzone from '@/components/FileUploadDropzone';
import { useApp } from '@/contexts/AppContext';
import { UploadedFile } from '@/lib/storage';
import { toast } from 'sonner';

const Upload = () => {
  const navigate = useNavigate();
  const { state, addUploadedFile } = useApp();

  // Note: Files are already cleared in setCurrentPatient when starting a new case
  // No need to clear here - it could interfere with the state

  const handleFilesAdded = (files: UploadedFile[]) => {
    files.forEach(file => addUploadedFile(file));
    toast.success(`${files.length} file(s) added`);
    navigate('/upload/review');
  };

  const handleClose = () => {
    navigate('/home');
  };

  if (!state.currentPatient) {
    navigate('/home');
    return null;
  }

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 overflow-y-auto overscroll-y-none h-[calc(100vh-3rem)]">
        <div className="vmtb-card p-8 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-t from-primary to-primary/60 relative">
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-primary/80 to-transparent rounded-b-full" />
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-sky-300 rounded-full opacity-80" />
                </div>
              </div>
              <span className="text-xl font-semibold text-foreground">vMTB</span>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          <h2 className="text-lg font-medium text-foreground mb-6">Add Patient Documents</h2>

          <FileUploadDropzone onFilesAdded={handleFilesAdded} />
        </div>
      </main>
    </div>
  );
};

export default Upload;

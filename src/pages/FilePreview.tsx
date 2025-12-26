import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import ZoomablePreview from '@/components/ZoomablePreview';
import ConfirmModal from '@/components/ConfirmModal';
import CaseConfirmModal from '@/components/CaseConfirmModal';
import FullPageLoader from '@/components/FullPageLoader';
import { useApp } from '@/contexts/AppContext';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * FilePreview page (Digitization) with redesigned compact header:
 * - Left: Previous button
 * - Center: File name, dropdown for file selection, file type tag
 * - Right: Next/Submit button
 * - Two-panel layout with fixed height image container
 */
const FilePreview = () => {
  const { fileIndex } = useParams();
  const navigate = useNavigate();
  const { 
    state, 
    updateFileExtractedData, 
    markFileAsEdited,
    markDigitizedVisited,
    markDigitizedDirty,
    getMissingAnonymization,
    getMissingDigitization,
    clearUploadedFiles,
  } = useApp();
  const { createPatientAndCase, modifyCase: supabaseModifyCase } = useSupabaseData();
  const mode = state.isEditMode ? 'MODIFY' : 'CREATE';
  const [jsonText, setJsonText] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [triggerShake, setTriggerShake] = useState(false);

  const currentIndex = parseInt(fileIndex || '0', 10);
  const currentFile = state.uploadedFiles[currentIndex];
  const totalFiles = state.uploadedFiles.length;
  const isLastFile = currentIndex === totalFiles - 1;
  const isFirstFile = currentIndex === 0;

  // Debug logging (dev-only)
  const logVisitedState = (reason: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[FilePreview] visited-state', reason, {
        currentIndex,
        currentFile: currentFile?.name,
        files: state.uploadedFiles.map(f => ({
          name: f.name,
          digitizedVisited: f.digitizedVisited,
          anonymizedVisited: f.anonymizedVisited,
          dirty: f.dirty,
          lastVisitedAt: f.lastVisitedAt,
        })),
      });
    }
  };

  // Mark file as visited immediately when user views it (via navigation, dropdown, etc.)
  useEffect(() => {
    if (currentFile) {
      markDigitizedVisited(currentFile.id);
      logVisitedState(`file viewed: ${currentFile.name}`);
    }
  }, [currentIndex, currentFile?.id]);

  // Update jsonText when currentIndex or currentFile changes
  useEffect(() => {
    if (currentFile?.extractedData) {
      setJsonText(JSON.stringify(currentFile.extractedData, null, 2));
    } else {
      setJsonText('{}');
    }
  }, [currentIndex, currentFile?.id, currentFile?.extractedData]);

  // Show loading state when file changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 second loader

    return () => clearTimeout(timer);
  }, [currentIndex]);


  const saveCurrentFile = () => {
    if (currentFile) {
      // Check if extracted data has changed (for edit mode)
      const originalFile = state.originalFiles.find(f => f.id === currentFile.id);
      const originalData = originalFile?.extractedData ? JSON.stringify(originalFile.extractedData) : '{}';
      const newData = jsonText;
      
      const savedData = currentFile.extractedData ? JSON.stringify(currentFile.extractedData, null, 2) : '{}';
      const hasChanged = newData !== savedData;
      
      try {
        const parsed = JSON.parse(newData);
        updateFileExtractedData(currentFile.id, parsed);
        
        // Mark as edited if data changed and in edit mode
        if (mode === 'MODIFY' && newData !== originalData) {
          markFileAsEdited(currentFile.id);
        }
        
        // When digitization edits occur, mark file as dirty and not visited (requires re-visit)
        if (hasChanged) {
          markDigitizedDirty(currentFile.id);
          logVisitedState(`file edited (digitized): ${currentFile.name}`);
        }
      } catch {
        updateFileExtractedData(currentFile.id, { content: newData });
        
        // Mark as edited if content changed and in edit mode
        if (mode === 'MODIFY' && originalData !== `{"content":"${newData}"}`) {
          markFileAsEdited(currentFile.id);
        }
        
        // When digitization edits occur, mark file as dirty and not visited (requires re-visit)
        if (hasChanged) {
          markDigitizedDirty(currentFile.id);
          logVisitedState(`file edited (digitized): ${currentFile.name}`);
        }
      }
    }
  };

  const handleNext = () => {
    saveCurrentFile();
    
    if (isLastFile) {
      // On last file, "Next" should trigger Create/Modify
      if (mode === 'CREATE') {
        handleCreateCaseClick();
      } else {
        handleModifyCaseClick();
      }
    } else {
      navigate(`/upload/preview/${currentIndex + 1}`);
    }
  };

  const handlePrevious = () => {
    saveCurrentFile();
    if (currentIndex > 0) {
      navigate(`/upload/preview/${currentIndex - 1}`);
    }
  };

  const handleFileSelect = (index: number) => {
    saveCurrentFile();
    navigate(`/upload/preview/${index}`);
  };

  const handleCreateCaseClick = () => {
    // Use functional update pattern to mark current file as visited and validate atomically
    // This ensures we validate against the latest state, not a stale closure
    const updatedFiles = state.uploadedFiles.map((f, i) =>
      i === currentIndex 
        ? { ...f, digitizedVisited: true, dirty: false, lastVisitedAt: Date.now() }
        : f
    );
    
    logVisitedState('before final validation (Create Case)');
    
    // Validate using the updated files array
    const missingAnon = getMissingAnonymization(updatedFiles);
    const missingDigit = getMissingDigitization(updatedFiles);
    
    if (missingAnon.length > 0 || missingDigit.length > 0) {
      setTriggerShake(true);
      setTimeout(() => setTriggerShake(false), 300);
      setShowIncompleteModal(true);
      logVisitedState(`validation failed: missing ${missingAnon.length} anon, ${missingDigit.length} digit`);
      return;
    }
    
    // Update state with visited flag
    markDigitizedVisited(currentFile.id);
    logVisitedState('validation passed, showing create modal');
    
    setShowSubmitModal(true);
  };

  const handleCreateCase = async () => {
    console.log('=== [handleCreateCase] START ===');
    console.log('[handleCreateCase] Current patient:', state.currentPatient);
    console.log('[handleCreateCase] Uploaded files:', state.uploadedFiles.length);

    if (!state.currentPatient) {
      console.error('[handleCreateCase] No patient data found');
      toast.error('No patient data found');
      throw new Error('No patient data found');
    }

    // Save current file data first
    console.log('[handleCreateCase] Saving current file data...');
    saveCurrentFile();
    
    console.log('[handleCreateCase] Calling createPatientAndCase...');
    console.log('[handleCreateCase] Patient:', state.currentPatient);
    console.log('[handleCreateCase] Files:', state.uploadedFiles.map(f => ({ 
      name: f.name, 
      hasDataURL: !!f.dataURL,
      hasAnonymizedDataURL: !!f.anonymizedDataURL,
      anonymizedVisited: f.anonymizedVisited,
      digitizedVisited: f.digitizedVisited,
    })));
    
    // Save to Supabase - this is the ONLY time we persist data
    const newCase = await createPatientAndCase(
      state.currentPatient,
      state.uploadedFiles
    );

    console.log('[handleCreateCase] createPatientAndCase result:', newCase ? newCase.id : 'null');

    if (newCase) {
      console.log('[handleCreateCase] SUCCESS - clearing state and navigating...');
      // Clear local state after successful save
      clearUploadedFiles();
      setShowSubmitModal(false);
      toast.success('Case created successfully!');
      navigate('/cases');
    } else {
      console.error('[handleCreateCase] createPatientAndCase returned null');
      toast.error('Failed to create case');
      throw new Error('Failed to create case');
    }
    
    console.log('=== [handleCreateCase] END ===');
  };

  const handleGoBack = () => {
    setShowSubmitModal(false);
  };

  const handleModifyCaseClick = () => {
    // Use functional update pattern to mark current file as visited and validate atomically
    // This ensures we validate against the latest state, not a stale closure
    const updatedFiles = state.uploadedFiles.map((f, i) =>
      i === currentIndex 
        ? { ...f, digitizedVisited: true, dirty: false, lastVisitedAt: Date.now() }
        : f
    );
    
    logVisitedState('before final validation (Modify Case)');
    
    // Validate using the updated files array
    const missingAnon = getMissingAnonymization(updatedFiles);
    const missingDigit = getMissingDigitization(updatedFiles);
    
    if (missingAnon.length > 0 || missingDigit.length > 0) {
      setTriggerShake(true);
      setTimeout(() => setTriggerShake(false), 300);
      setShowIncompleteModal(true);
      logVisitedState(`validation failed: missing ${missingAnon.length} anon, ${missingDigit.length} digit`);
      return;
    }
    
    // Update state with visited flag
    markDigitizedVisited(currentFile.id);
    logVisitedState('validation passed, showing modify modal');
    
    setShowModifyModal(true);
  };

  const handleModifyCase = async () => {
    if (!state.currentPatient || !state.editingCaseId) {
      toast.error('No case data found');
      throw new Error('No case data found');
    }

    saveCurrentFile();
    
    // Save to Supabase - this is the ONLY time we persist modifications
    const success = await supabaseModifyCase(
      state.editingCaseId,
      state.currentPatient,
      state.uploadedFiles,
      state.editedFileIds,
      state.originalFiles
    );

    if (success) {
      clearUploadedFiles();
      setShowModifyModal(false);
      toast.success('Case updated successfully!');
      navigate('/cases');
    } else {
      toast.error('Failed to update case');
      throw new Error('Failed to update case');
    }
  };

  const handleGoBackFromModify = () => {
    setShowModifyModal(false);
  };

  const handleGoBackFromIncomplete = () => {
    setShowIncompleteModal(false);
    const missingAnon = getMissingAnonymization();
    const missingDigit = getMissingDigitization();
    
    // Navigate to anonymization if missing anon, otherwise digitization
    if (missingAnon.length > 0) {
      const firstMissing = state.uploadedFiles.find(f => missingAnon.includes(f.name));
      if (firstMissing) {
        const index = state.uploadedFiles.findIndex(f => f.id === firstMissing.id);
        if (index >= 0) {
          navigate(`/upload/anonymize/${index}`);
        }
      }
    } else if (missingDigit.length > 0) {
      const firstMissing = state.uploadedFiles.find(f => missingDigit.includes(f.name));
      if (firstMissing) {
        const index = state.uploadedFiles.findIndex(f => f.id === firstMissing.id);
        if (index >= 0) {
          navigate(`/upload/preview/${index}`);
        }
      }
    }
  };

  if (!state.currentPatient || !currentFile) {
    navigate('/home');
    return null;
  }

  return (
    <div className={`h-screen bg-muted flex flex-col overflow-hidden overscroll-y-none ${triggerShake ? 'shake' : ''}`}>
      <Header />
      
      {/* Compact Single-Row File Navigation Header */}
      <div className="bg-background border-b border-border px-3 py-1.5 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Back to Anonymize Button */}
          <button
            onClick={() => navigate(`/upload/anonymize/${currentIndex}`)}
            className="vmtb-btn-outline flex items-center gap-1 px-2.5 py-1 text-xs flex-shrink-0"
            aria-label="Back to anonymize"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Anonymize
          </button>

          {/* Center: File Name with Dropdown */}
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary truncate max-w-[180px] md:max-w-[280px]">
                  <span className="truncate">{currentFile.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="max-h-60 overflow-y-auto">
                {state.uploadedFiles.map((file, index) => (
                  <DropdownMenuItem
                    key={file.id}
                    onClick={() => handleFileSelect(index)}
                    className={index === currentIndex ? 'bg-primary/10' : ''}
                  >
                    <div className="flex items-center justify-between gap-3 w-full group">
                      <span className={file.name.length > 100 ? 'truncate max-w-[200px]' : ''}>{file.name.length > 100 ? file.name.substring(0, 97) + '...' : file.name}</span>
                      {file.digitizedVisited && (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 file-row-tick" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* File Type Tag */}
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium flex-shrink-0">
              {currentFile.fileCategory}
            </span>
          </div>

          {/* Right: Buttons based on CREATE vs MODIFY mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={isFirstFile}
              className="vmtb-btn-outline flex items-center gap-1 px-2.5 py-1 text-xs disabled:opacity-50 flex-shrink-0"
              aria-label="Previous file"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            {mode === 'CREATE' ? (
              // CREATE mode: Next on non-last, Create Case on last
              <>
                {!isLastFile && (
                  <button 
                    onClick={handleNext} 
                    className="vmtb-btn-primary flex items-center gap-1 px-2.5 py-1 text-xs flex-shrink-0"
                    aria-label="Next file"
                  >
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {isLastFile && (
                  <button
                    onClick={handleCreateCaseClick}
                    className="vmtb-btn-primary flex items-center gap-1 px-2.5 py-1 text-xs flex-shrink-0"
                    aria-label="Create case"
                  >
                    Create Case
                  </button>
                )}
              </>
            ) : (
              // MODIFY mode: Next on non-last, Modify Case always visible
              <>
                {!isLastFile && (
                  <button 
                    onClick={handleNext} 
                    className="vmtb-btn-primary flex items-center gap-1 px-2.5 py-1 text-xs flex-shrink-0"
                    aria-label="Next file"
                  >
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={handleModifyCaseClick}
                  className="vmtb-btn-primary flex items-center gap-1 px-2.5 py-1 text-xs flex-shrink-0"
                  aria-label="Modify case"
                >
                  Modify Case
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Two Panel Layout - fills remaining height */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left Panel - Document Preview with fixed height container */}
        <div className="w-full md:w-1/2 h-[40vh] md:h-full border-b md:border-b-0 md:border-r border-border p-3 overflow-hidden">
          <div className="h-full rounded-lg overflow-auto hide-scrollbar">
            <ZoomablePreview file={currentFile} />
          </div>
        </div>

        {/* Right Panel - JSON Editor or Loader */}
        <div className="w-full md:w-1/2 flex flex-col p-3 overflow-hidden flex-1 md:flex-initial md:h-full">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <div className="mb-4 flex justify-center">
                <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
              </div>
              <p className="text-sm font-medium">Processing, please wait…</p>
            </div>
          ) : (
            <textarea
              value={jsonText}
              onChange={e => {
                setJsonText(e.target.value);
                // When user edits digitized text, mark file as dirty and not visited (requires re-visit)
                // Only mark if the text actually differs from the saved state
                if (currentFile) {
                  const savedData = currentFile.extractedData ? JSON.stringify(currentFile.extractedData, null, 2) : '{}';
                  if (e.target.value !== savedData) {
                    markDigitizedDirty(currentFile.id);
                  }
                }
              }}
              className="flex-1 vmtb-input font-mono text-sm resize-none min-h-[150px]"
              placeholder="Extracted JSON data..."
              spellCheck={false}
            />
          )}
        </div>
      </main>

      {/* Incomplete Documents Warning Modal */}
      <ConfirmModal
        open={showIncompleteModal}
        onOpenChange={setShowIncompleteModal}
        title="Some documents are incomplete"
        description={`Please complete the following documents before proceeding: ${[...getMissingAnonymization(), ...getMissingDigitization()].join(', ')}`}
        confirmLabel="Go Back & Complete"
        cancelLabel=""
        onConfirm={handleGoBackFromIncomplete}
        onCancel={() => setShowIncompleteModal(false)}
      />

      {/* Final Submit Confirmation Modal - Create Case */}
      <CaseConfirmModal
        open={showSubmitModal}
        onOpenChange={setShowSubmitModal}
        onConfirm={handleCreateCase}
        mode="create"
      />

      {/* Modify Case Confirmation Modal */}
      <CaseConfirmModal
        open={showModifyModal}
        onOpenChange={setShowModifyModal}
        onConfirm={handleModifyCase}
        mode="update"
      />
    </div>
  );
};

export default FilePreview;

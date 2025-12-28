import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { PatientData, UploadedFile } from '@/lib/storage';

/**
 * AppContext - Manages TEMPORARY frontend workflow state only.
 * 
 * This context is for the case creation/editing flow and holds data
 * that exists ONLY in memory until the final "Create Case" or "Modify Case" action.
 * 
 * All persistent data (cases, MTBs, meetings, invitations) is managed by
 * dedicated Supabase hooks, not this context.
 * 
 * IMPORTANT: Page refresh clears all state here. That's intentional.
 */

interface AppContextType {
  // Current workflow state
  currentPatient: PatientData | null;
  existingDocumentNames: string[]; // Names of documents already in DB (for edit mode)
  uploadedFiles: UploadedFile[];
  isEditMode: boolean;
  editingCaseId: string | null;
  originalFiles: UploadedFile[];
  editedFileIds: string[];

  // Actions for case creation workflow
  setCurrentPatient: (patient: PatientData) => void;
  setExistingDocumentNames: (names: string[]) => void;
  addUploadedFile: (file: UploadedFile) => boolean; // Returns false if duplicate name
  isFileNameDuplicate: (name: string) => boolean;
  removeUploadedFile: (id: string) => void;
  updateFileCategory: (id: string, category: string) => void;
  updateFileName: (id: string, name: string) => void;
  updateFileExtractedData: (id: string, data: Record<string, string>) => void;
  updateAnonymizedImage: (id: string, anonymizedDataURL: string) => void;
  updateAnonymizedPDFPages: (id: string, anonymizedPages: string[]) => void;
  updatePDFPages: (id: string, pdfPages: string[]) => void;
  clearUploadedFiles: () => void;
  markFileAsEdited: (fileId: string) => void;

  // Visited flag management
  setAnonymizedVisited: (fileId: string, visited: boolean) => void;
  setDigitizedVisited: (fileId: string, visited: boolean) => void;
  markAnonymizedVisited: (fileId: string) => void;
  markDigitizedVisited: (fileId: string) => void;
  markAnonymizedDirty: (fileId: string) => void;
  markDigitizedDirty: (fileId: string) => void;
  getMissingAnonymization: (files?: UploadedFile[]) => string[];
  getMissingDigitization: (files?: UploadedFile[]) => string[];
  isCreateValid: () => boolean;
  isModifyValid: () => boolean;

  // Edit mode setup
  setupEditMode: (caseId: string, patient: PatientData, files: UploadedFile[]) => void;
  clearEditMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Workflow state - all temporary, cleared on refresh
  const [currentPatient, setCurrentPatientState] = useState<PatientData | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [originalFiles, setOriginalFiles] = useState<UploadedFile[]>([]);
  const [editedFileIds, setEditedFileIds] = useState<string[]>([]);
  const [existingDocumentNames, setExistingDocumentNames] = useState<string[]>([]);

  const setCurrentPatient = (patient: PatientData) => {
    // Always reset to create mode when called from Home
    setCurrentPatientState(patient);
    setIsEditMode(false);
    setEditingCaseId(null);
    setUploadedFiles([]);
    setEditedFileIds([]);
    setOriginalFiles([]);
    setExistingDocumentNames([]);
  };

  // Check if a file name already exists in uploaded files or existing documents
  const isFileNameDuplicate = (name: string): boolean => {
    const normalizedName = name.toLowerCase().trim();
    // Check against currently uploaded files
    const inUploadedFiles = uploadedFiles.some(f => f.name.toLowerCase().trim() === normalizedName);
    // Check against existing documents in DB (for edit mode)
    const inExistingDocs = existingDocumentNames.some(n => n.toLowerCase().trim() === normalizedName);
    return inUploadedFiles || inExistingDocs;
  };

  const addUploadedFile = (file: UploadedFile): boolean => {
    // Check for duplicate name
    if (isFileNameDuplicate(file.name)) {
      return false; // Duplicate, don't add
    }
    
    const now = new Date().toISOString();
    const fileWithDefaults: UploadedFile = {
      ...file,
      mimeType: file.type,
      createdAt: now,
      uploadedAt: now,
      anonymizedVisited: false,
      digitizedVisited: false,
      visited: false,
      dirty: false,
    };
    setUploadedFiles(prev => [...prev, fileWithDefaults]);
    return true; // Successfully added
  };

  const removeUploadedFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFileCategory = (id: string, category: string) => {
    setUploadedFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, fileCategory: category } : f))
    );
  };

  const updateFileName = (id: string, name: string) => {
    setUploadedFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, name } : f))
    );
  };

  const updateFileExtractedData = (id: string, data: Record<string, string>) => {
    setUploadedFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, extractedData: data } : f))
    );
  };

  const updateAnonymizedImage = (id: string, anonymizedDataURL: string) => {
    const now = new Date().toISOString();
    setUploadedFiles(prev =>
      prev.map(f =>
        f.id === id
          ? {
              ...f,
              anonymizedDataURL,
              anonymizedChangedAt: now,
              digitizedVisited: false,
              dirty: true,
              lastModifiedAt: now,
            }
          : f
      )
    );
  };

  const updateAnonymizedPDFPages = (id: string, anonymizedPages: string[]) => {
    const now = new Date().toISOString();
    setUploadedFiles(prev =>
      prev.map(f =>
        f.id === id
          ? {
              ...f,
              anonymizedPages,
              anonymizedChangedAt: now,
              digitizedVisited: false,
              dirty: true,
              lastModifiedAt: now,
            }
          : f
      )
    );
  };

  const updatePDFPages = (id: string, pdfPages: string[]) => {
    setUploadedFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, pdfPages } : f))
    );
  };

  const clearUploadedFiles = () => {
    setUploadedFiles([]);
    setEditedFileIds([]);
    setOriginalFiles([]);
    // Note: Don't clear existingDocumentNames here - they're from DB
  };

  const markFileAsEdited = (fileId: string) => {
    setEditedFileIds(prev => Array.from(new Set([...prev, fileId])));
  };

  const setAnonymizedVisited = (fileId: string, visited: boolean) => {
    setUploadedFiles(prev =>
      prev.map(f => (f.id === fileId ? { ...f, anonymizedVisited: visited } : f))
    );
  };

  const setDigitizedVisited = (fileId: string, visited: boolean) => {
    setUploadedFiles(prev =>
      prev.map(f => (f.id === fileId ? { ...f, digitizedVisited: visited } : f))
    );
  };

  const markAnonymizedVisited = (fileId: string) => {
    setUploadedFiles(prev =>
      prev.map(f =>
        f.id === fileId
          ? { ...f, anonymizedVisited: true, dirty: false, lastVisitedAt: Date.now() }
          : f
      )
    );
  };

  const markDigitizedVisited = (fileId: string) => {
    setUploadedFiles(prev =>
      prev.map(f =>
        f.id === fileId
          ? { ...f, digitizedVisited: true, dirty: false, lastVisitedAt: Date.now() }
          : f
      )
    );
  };

  const markAnonymizedDirty = (fileId: string) => {
    setUploadedFiles(prev =>
      prev.map(f =>
        f.id === fileId ? { ...f, anonymizedVisited: false, dirty: true } : f
      )
    );
  };

  const markDigitizedDirty = (fileId: string) => {
    setUploadedFiles(prev =>
      prev.map(f =>
        f.id === fileId ? { ...f, digitizedVisited: false, dirty: true } : f
      )
    );
  };

  const getMissingAnonymization = (files?: UploadedFile[]): string[] => {
    const filesToCheck = files || uploadedFiles;
    return filesToCheck.filter(f => !f.anonymizedVisited).map(f => f.name);
  };

  const getMissingDigitization = (files?: UploadedFile[]): string[] => {
    const filesToCheck = files || uploadedFiles;
    return filesToCheck.filter(f => !f.digitizedVisited).map(f => f.name);
  };

  const isCreateValid = (): boolean => {
    return uploadedFiles.every(f => f.anonymizedVisited && f.digitizedVisited);
  };

  const isModifyValid = (): boolean => {
    return uploadedFiles.every(f => {
      if (isEditMode && originalFiles.some(orig => orig.id === f.id)) {
        const wasEdited = editedFileIds.includes(f.id);
        if (!wasEdited) {
          return true;
        }
      }
      return f.anonymizedVisited && f.digitizedVisited;
    });
  };

  const setupEditMode = (caseId: string, patient: PatientData, files: UploadedFile[]) => {
    const filesWithFlags = files.map(file => ({
      ...file,
      anonymizedVisited: file.anonymizedVisited ?? true,
      digitizedVisited: file.digitizedVisited ?? true,
    }));

    setCurrentPatientState(patient);
    setUploadedFiles(filesWithFlags);
    setIsEditMode(true);
    setEditingCaseId(caseId);
    setOriginalFiles([...files]);
    setEditedFileIds([]);
  };

  const clearEditMode = () => {
    setCurrentPatientState(null);
    setUploadedFiles([]);
    setIsEditMode(false);
    setEditingCaseId(null);
    setOriginalFiles([]);
    setEditedFileIds([]);
    setExistingDocumentNames([]);
  };

  return (
    <AppContext.Provider
      value={{
        currentPatient,
        uploadedFiles,
        isEditMode,
        editingCaseId,
        originalFiles,
        editedFileIds,
        existingDocumentNames,
        setCurrentPatient,
        setExistingDocumentNames,
        addUploadedFile,
        isFileNameDuplicate,
        removeUploadedFile,
        updateFileCategory,
        updateFileName,
        updateFileExtractedData,
        updateAnonymizedImage,
        updateAnonymizedPDFPages,
        updatePDFPages,
        clearUploadedFiles,
        markFileAsEdited,
        setAnonymizedVisited,
        setDigitizedVisited,
        markAnonymizedVisited,
        markDigitizedVisited,
        markAnonymizedDirty,
        markDigitizedDirty,
        getMissingAnonymization,
        getMissingDigitization,
        isCreateValid,
        isModifyValid,
        setupEditMode,
        clearEditMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

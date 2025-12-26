import { create } from 'zustand';
import type { 
  PatientMetadata, 
  CaseMetadata, 
  TemporaryDocument, 
  CreateCaseStep,
  ValidationResult 
} from '@/types/vmtb';

interface CreateCaseState {
  // Current step
  currentStep: CreateCaseStep;
  
  // Patient metadata (stored in memory only)
  patientMetadata: PatientMetadata | null;
  
  // Case metadata
  caseMetadata: CaseMetadata | null;
  
  // Documents in memory (NEVER auto-persisted)
  documents: TemporaryDocument[];
  
  // Active document being edited
  activeDocumentId: string | null;
  
  // Validation state
  validationErrors: string[];
  showValidationPopup: boolean;
  shakeScreen: boolean;
  
  // Loading states
  isAnonymizing: boolean;
  isDigitizing: boolean;
  isCreating: boolean;
  
  // Actions
  setStep: (step: CreateCaseStep) => void;
  setPatientMetadata: (metadata: PatientMetadata) => void;
  setCaseMetadata: (metadata: CaseMetadata) => void;
  
  // Document actions
  addDocuments: (files: File[]) => void;
  removeDocument: (id: string) => void;
  setActiveDocument: (id: string | null) => void;
  markDocumentVisitedAnonymization: (id: string) => void;
  markDocumentVisitedDigitization: (id: string) => void;
  setDocumentAnonymizedBlob: (id: string, blob: Blob) => void;
  setDocumentDigitizedText: (id: string, text: string) => void;
  
  // Validation
  validateMetadata: () => ValidationResult;
  validateDocumentsUploaded: () => ValidationResult;
  validateAnonymization: () => ValidationResult;
  validateDigitization: () => ValidationResult;
  validateAll: () => ValidationResult;
  setValidationErrors: (errors: string[]) => void;
  setShowValidationPopup: (show: boolean) => void;
  triggerShake: () => void;
  
  // Loading states
  setIsAnonymizing: (loading: boolean) => void;
  setIsDigitizing: (loading: boolean) => void;
  setIsCreating: (loading: boolean) => void;
  
  // Reset (clears ALL temporary state)
  reset: () => void;
}

const generateDocumentId = () => `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const initialState = {
  currentStep: 'metadata' as CreateCaseStep,
  patientMetadata: null,
  caseMetadata: null,
  documents: [],
  activeDocumentId: null,
  validationErrors: [],
  showValidationPopup: false,
  shakeScreen: false,
  isAnonymizing: false,
  isDigitizing: false,
  isCreating: false,
};

export const useCreateCaseStore = create<CreateCaseState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  setPatientMetadata: (metadata) => set({ patientMetadata: metadata }),

  setCaseMetadata: (metadata) => set({ caseMetadata: metadata }),

  addDocuments: (files) => {
    const newDocs: TemporaryDocument[] = files.map((file) => {
      const isPdf = file.type === 'application/pdf';
      return {
        id: generateDocumentId(),
        fileName: file.name,
        fileType: isPdf ? 'pdf' : 'image',
        mimeType: file.type,
        file,
        previewUrl: URL.createObjectURL(file),
        pages: isPdf ? 1 : 1, // PDF page count would be determined later
        visitedInAnonymization: false,
        visitedInDigitization: false,
      };
    });
    set((state) => ({ documents: [...state.documents, ...newDocs] }));
  },

  removeDocument: (id) => {
    const doc = get().documents.find((d) => d.id === id);
    if (doc) {
      URL.revokeObjectURL(doc.previewUrl);
    }
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      activeDocumentId: state.activeDocumentId === id ? null : state.activeDocumentId,
    }));
  },

  setActiveDocument: (id) => set({ activeDocumentId: id }),

  markDocumentVisitedAnonymization: (id) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, visitedInAnonymization: true } : doc
      ),
    }));
  },

  markDocumentVisitedDigitization: (id) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, visitedInDigitization: true } : doc
      ),
    }));
  },

  setDocumentAnonymizedBlob: (id, blob) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, anonymizedBlob: blob } : doc
      ),
    }));
  },

  setDocumentDigitizedText: (id, text) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, digitizedText: text } : doc
      ),
    }));
  },

  validateMetadata: () => {
    const { patientMetadata, caseMetadata } = get();
    const errors: string[] = [];

    if (!patientMetadata?.name?.trim()) errors.push('Patient name is required');
    if (!patientMetadata?.age || patientMetadata.age < 0 || patientMetadata.age > 150) {
      errors.push('Valid patient age is required');
    }
    if (!patientMetadata?.sex) errors.push('Patient sex is required');
    if (!caseMetadata?.caseName?.trim()) errors.push('Case name is required');
    if (!caseMetadata?.cancerType) errors.push('Cancer type is required');

    return { valid: errors.length === 0, errors };
  },

  validateDocumentsUploaded: () => {
    const { documents } = get();
    const errors: string[] = [];

    if (documents.length === 0) {
      errors.push('At least one document must be uploaded');
    }

    return { valid: errors.length === 0, errors };
  },

  validateAnonymization: () => {
    const { documents } = get();
    const unvisited = documents.filter((d) => !d.visitedInAnonymization);
    const errors: string[] = [];

    if (unvisited.length > 0) {
      errors.push(`${unvisited.length} document(s) require review for anonymization`);
    }

    return {
      valid: unvisited.length === 0,
      errors,
      unverifiedDocuments: unvisited.map((d) => d.fileName),
    };
  },

  validateDigitization: () => {
    const { documents } = get();
    const unvisited = documents.filter((d) => !d.visitedInDigitization);
    const errors: string[] = [];

    if (unvisited.length > 0) {
      errors.push(`${unvisited.length} document(s) require review for digitization`);
    }

    return {
      valid: unvisited.length === 0,
      errors,
      unverifiedDocuments: unvisited.map((d) => d.fileName),
    };
  },

  validateAll: () => {
    const metadataResult = get().validateMetadata();
    const uploadResult = get().validateDocumentsUploaded();
    const anonymizationResult = get().validateAnonymization();
    const digitizationResult = get().validateDigitization();

    const allErrors = [
      ...metadataResult.errors,
      ...uploadResult.errors,
      ...anonymizationResult.errors,
      ...digitizationResult.errors,
    ];

    const unverifiedDocs = [
      ...(anonymizationResult.unverifiedDocuments || []),
      ...(digitizationResult.unverifiedDocuments || []),
    ];

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      unverifiedDocuments: [...new Set(unverifiedDocs)],
    };
  },

  setValidationErrors: (errors) => set({ validationErrors: errors }),

  setShowValidationPopup: (show) => set({ showValidationPopup: show }),

  triggerShake: () => {
    set({ shakeScreen: true });
    setTimeout(() => set({ shakeScreen: false }), 500);
  },

  setIsAnonymizing: (loading) => set({ isAnonymizing: loading }),
  setIsDigitizing: (loading) => set({ isDigitizing: loading }),
  setIsCreating: (loading) => set({ isCreating: loading }),

  reset: () => {
    // Revoke all object URLs to prevent memory leaks
    get().documents.forEach((doc) => {
      URL.revokeObjectURL(doc.previewUrl);
    });
    set(initialState);
  },
}));

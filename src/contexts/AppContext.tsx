import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AppState,
  User,
  PatientData,
  UploadedFile,
  Case,
  ChatMessage,
  MTB,
  Invitation,
  loadState,
  saveState,
  generateId,
} from '@/lib/storage';

interface AppContextType {
  state: AppState;
  login: (email: string, password: string) => boolean;
  signup: (user: Omit<User, 'id' | 'verified'>) => boolean;
  logout: () => void;
  verifyOTP: (otp: string) => boolean;
  setOTPEmail: (email: string) => void;
  initializeEmailChange: (newEmail: string) => void;
  verifyEmailOTP: (otp: string) => boolean;
  setCurrentPatient: (patient: PatientData) => void;
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (id: string) => void;
  updateFileCategory: (id: string, category: string) => void;
  updateFileName: (id: string, name: string) => void;
  updateFileExtractedData: (id: string, data: Record<string, string>) => void;
  updateAnonymizedImage: (id: string, anonymizedDataURL: string) => void;
  updateAnonymizedPDFPages: (id: string, anonymizedPages: string[]) => void;
  updatePDFPages: (id: string, pdfPages: string[]) => void;
  createCase: (clinicalSummary?: string) => Case | null;
  deleteCase: (caseId: string) => void;
  loadCaseForEditing: (caseId: string) => boolean;
  setupEditMode: (caseId: string, patient: PatientData, files: UploadedFile[]) => void;
  modifyCase: () => boolean;
  sendMessage: (caseId: string, expertId: string, content: string) => void;
  sendGroupMessage: (caseId: string, content: string) => void;
  clearUploadedFiles: () => void;
  updateUser: (updates: Partial<User>) => void;
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
  // MTB functions
  createMTB: (name: string, dpImage: string | null, caseIds: string[]) => MTB | null;
  deleteMTB: (mtbId: string) => void;
  removeExpertFromMTB: (mtbId: string, expertId: string) => void;
  addCasesToMTB: (mtbId: string, caseIds: string[]) => void;
  removeCaseFromMTB: (mtbId: string, caseId: string) => void;
  // Invitation functions
  sendInvitations: (mtbId: string, mtbName: string, emails: string[]) => void;
  markInvitationsRead: () => void;
  acceptInvitation: (invitation: Invitation) => void;
  declineInvitation: (invitation: Invitation) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const login = (email: string, password: string): boolean => {
    const user = state.users.find(u => u.email === email && u.password === password);
    if (user && user.verified) {
      setState(prev => ({ ...prev, loggedInUser: user }));
      return true;
    }
    return false;
  };

  const signup = (userData: Omit<User, 'id' | 'verified'>): boolean => {
    const exists = state.users.some(u => u.email === userData.email);
    if (exists) return false;

    const newUser: User = {
      ...userData,
      id: generateId(),
      verified: false,
    };

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP:', otp); // For testing

    setState(prev => ({
      ...prev,
      users: [...prev.users, newUser],
      otpEmail: userData.email,
      otp,
    }));

    return true;
  };

  const logout = () => {
    setState(prev => ({
      ...prev,
      loggedInUser: null,
      currentPatient: null,
      uploadedFiles: [],
    }));
  };

  const verifyOTP = (inputOtp: string): boolean => {
    if (state.otp === inputOtp && state.otpEmail) {
      setState(prev => ({
        ...prev,
        users: prev.users.map(u =>
          u.email === prev.otpEmail ? { ...u, verified: true } : u
        ),
        otp: null,
        otpEmail: null,
      }));
      return true;
    }
    return false;
  };

  const setOTPEmail = (email: string) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP for reset:', otp);
    setState(prev => ({ ...prev, otpEmail: email, otp }));
  };

  const setCurrentPatient = (patient: PatientData) => {
    // This function is ONLY called from Home.tsx for creating NEW cases
    // It must ALWAYS reset edit mode and clear all previous upload state
    setState(prev => ({
      ...prev,
      currentPatient: patient,
      // Always reset to create mode
      isEditMode: false,
      editingCaseId: null,
      // Clear all upload-related state for new case
      uploadedFiles: [],
      editedFileIds: [],
      originalFiles: [],
    }));
  };

  const addUploadedFile = (file: UploadedFile) => {
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
    setState(prev => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, fileWithDefaults],
    }));
  };

  const removeUploadedFile = (id: string) => {
    setState(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter(f => f.id !== id),
    }));
  };

  const updateFileCategory = (id: string, category: string) => {
    setState(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.map(f =>
        f.id === id ? { ...f, fileCategory: category } : f
      ),
    }));
  };

  const updateFileName = (id: string, name: string) => {
    setState(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.map(f =>
        f.id === id ? { ...f, name } : f
      ),
    }));
  };

  const updateFileExtractedData = (id: string, data: Record<string, string>) => {
    setState(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.map(f =>
        f.id === id ? { ...f, extractedData: data } : f
      ),
    }));
  };

  const updateAnonymizedImage = (id: string, anonymizedDataURL: string) => {
    const now = new Date().toISOString();
    setState(prev => {
      const file = prev.uploadedFiles.find(f => f.id === id);
      const currentAnonymizedVisited = file?.anonymizedVisited === true;
      const isEditMode = prev.isEditMode;
      
      if (process.env.NODE_ENV === 'development') {
        console.debug('[updateAnonymizedImage] file edited', id, {
          currentAnonymizedVisited,
          isEditMode,
          willKeepAnonymizedVisited: currentAnonymizedVisited,
        });
      }
      
      return {
        ...prev,
        uploadedFiles: prev.uploadedFiles.map(f =>
          f.id === id 
            ? { 
                ...f, 
                anonymizedDataURL,
                anonymizedChangedAt: now,
                // IMPORTANT: In CREATE mode, once a file is marked as visited (by navigating to it),
                // it should stay visited even after edits. Edits should NOT reset the visited state.
                // In EDIT mode, apply the same logic: if already visited, stay visited.
                // The visited state is determined only by whether the user has navigated to the file.
                anonymizedVisited: currentAnonymizedVisited,
                // Always clear digitization when anonymization changes
                digitizedVisited: false,
                dirty: true,
                lastModifiedAt: now,
              } 
            : f
        ),
      };
    });
  };

  const updateAnonymizedPDFPages = (id: string, anonymizedPages: string[]) => {
    const now = new Date().toISOString();
    setState(prev => {
      const file = prev.uploadedFiles.find(f => f.id === id);
      const currentAnonymizedVisited = file?.anonymizedVisited === true;
      const isEditMode = prev.isEditMode;
      
      return {
        ...prev,
        uploadedFiles: prev.uploadedFiles.map(f =>
          f.id === id 
            ? { 
                ...f, 
                anonymizedPages,
                anonymizedChangedAt: now,
                // IMPORTANT: In CREATE mode, once a file is marked as visited (by navigating to it),
                // it should stay visited even after edits. Edits should NOT reset the visited state.
                // In EDIT mode, apply the same logic: if already visited, stay visited.
                // The visited state is determined only by whether the user has navigated to the file.
                anonymizedVisited: currentAnonymizedVisited,
                // Always clear digitization when anonymization changes
                digitizedVisited: false,
                dirty: true,
                lastModifiedAt: now,
              } 
            : f
        ),
      };
    });
    
    if (process.env.NODE_ENV === 'development') {
      const file = state.uploadedFiles.find(f => f.id === id);
      console.debug('[updateAnonymizedPDFPages] file edited', id, {
        currentAnonymizedVisited: file?.anonymizedVisited === true,
        isEditMode: state.isEditMode,
        anonymizedVisited: file?.anonymizedVisited === true,
        digitizedVisited: false,
      });
    }
  };

  const updatePDFPages = (id: string, pdfPages: string[]) => {
    setState(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.map(f =>
        f.id === id ? { ...f, pdfPages } : f
      ),
    }));
  };

  const createCase = (clinicalSummary?: string): Case | null => {
    if (!state.currentPatient || !state.currentPatient.caseName || state.uploadedFiles.length === 0) return null;

    const caseName = state.currentPatient.caseName;

    // Check if case name already exists for this user
    const caseNameExists = state.cases.some(
      c => c.caseName === caseName && c.ownerId === state.loggedInUser?.id
    );
    if (caseNameExists) return null;

    const newCase: Case = {
      id: generateId(),
      caseName,
      patientId: generateId(),
      patient: state.currentPatient,
      files: [...state.uploadedFiles],
      status: 'Pending',
      createdDate: new Date().toISOString(),
      clinicalSummary,
      ownerId: state.loggedInUser?.id,
    };

    setState(prev => ({
      ...prev,
      cases: [...prev.cases, newCase],
      currentPatient: null,
      uploadedFiles: [],
    }));

    return newCase;
  };

  const deleteCase = (caseId: string) => {
    setState(prev => ({
      ...prev,
      cases: prev.cases.filter(c => c.id !== caseId),
      // Also remove from MTBs
      mtbs: prev.mtbs.map(mtb => ({
        ...mtb,
        cases: mtb.cases.filter(id => id !== caseId),
        casesCount: mtb.cases.filter(id => id !== caseId).length,
      })),
    }));
  };

  const sendMessage = (caseId: string, expertId: string, content: string) => {
    if (!state.loggedInUser) return;

    const chatKey = `${caseId}-${expertId}`;
    const message: ChatMessage = {
      id: generateId(),
      expertId,
      caseId,
      senderId: state.loggedInUser.id,
      content,
      timestamp: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      chats: {
        ...prev.chats,
        [chatKey]: [...(prev.chats[chatKey] || []), message],
      },
    }));
  };

  const clearUploadedFiles = () => {
    // This clears uploaded files but preserves the current mode (create vs edit)
    // The mode is set by setCurrentPatient (create) or setupEditMode (edit)
    setState(prev => ({
      ...prev,
      uploadedFiles: [],
      editedFileIds: [],
      originalFiles: [],
    }));
  };

  const markFileAsEdited = (fileId: string) => {
    setState(prev => ({
      ...prev,
      editedFileIds: Array.from(new Set([...prev.editedFileIds, fileId])),
    }));
  };

  const setAnonymizedVisited = (fileId: string, visited: boolean) => {
    setState(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.map(f =>
        f.id === fileId ? { ...f, anonymizedVisited: visited } : f
      ),
    }));
  };

  const setDigitizedVisited = (fileId: string, visited: boolean) => {
    setState(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.map(f =>
        f.id === fileId ? { ...f, digitizedVisited: visited } : f
      ),
    }));
  };

  const getMissingAnonymization = (files?: UploadedFile[]): string[] => {
    const filesToCheck = files || state.uploadedFiles;
    return filesToCheck
      .filter(f => !f.anonymizedVisited)
      .map(f => f.name);
  };

  const getMissingDigitization = (files?: UploadedFile[]): string[] => {
    const filesToCheck = files || state.uploadedFiles;
    return filesToCheck
      .filter(f => !f.digitizedVisited)
      .map(f => f.name);
  };

  // Mark file as visited (for anonymization) with dirty flag management
  const markAnonymizedVisited = (fileId: string) => {
    setState(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.map(f =>
        f.id === fileId 
          ? { ...f, anonymizedVisited: true, dirty: false, lastVisitedAt: Date.now() }
          : f
      ),
    }));
  };

  // Mark file as visited (for digitization) with dirty flag management
  const markDigitizedVisited = (fileId: string) => {
    setState(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.map(f =>
        f.id === fileId 
          ? { ...f, digitizedVisited: true, dirty: false, lastVisitedAt: Date.now() }
          : f
      ),
    }));
  };

  // Mark file as dirty and clear visited (for anonymization edits)
  const markAnonymizedDirty = (fileId: string) => {
    setState(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.map(f =>
        f.id === fileId 
          ? { ...f, anonymizedVisited: false, dirty: true }
          : f
      ),
    }));
  };

  // Mark file as dirty and clear visited (for digitization edits)
  const markDigitizedDirty = (fileId: string) => {
    setState(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.map(f =>
        f.id === fileId 
          ? { ...f, digitizedVisited: false, dirty: true }
          : f
      ),
    }));
  };

  const isCreateValid = (): boolean => {
    return state.uploadedFiles.every(f => f.anonymizedVisited && f.digitizedVisited);
  };

  const isModifyValid = (): boolean => {
    // In modify mode, only files that were added or changed need to be visited
    // For now, we'll check all files that don't have both flags set
    // This can be refined based on tracking which files were actually modified
    return state.uploadedFiles.every(f => {
      // If file was in original files and not edited, it's valid
      if (state.isEditMode && state.originalFiles.some(orig => orig.id === f.id)) {
        const wasEdited = state.editedFileIds.includes(f.id);
        if (!wasEdited) {
          return true; // Original file that wasn't edited is valid
        }
      }
      // New files or edited files need both flags
      return f.anonymizedVisited && f.digitizedVisited;
    });
  };

  const loadCaseForEditing = (caseId: string): boolean => {
    const caseToEdit = state.cases.find(c => c.id === caseId);
    if (!caseToEdit) return false;

    // Load case's patient data and files for editing
    // Initialize visited flags for existing files (they're already visited)
    const filesWithFlags = caseToEdit.files.map(file => ({
      ...file,
      anonymizedVisited: file.anonymizedVisited ?? true, // Default to true for existing files
      digitizedVisited: file.digitizedVisited ?? true, // Default to true for existing files
    }));

    setState(prev => ({
      ...prev,
      currentPatient: caseToEdit.patient,
      uploadedFiles: filesWithFlags,
      isEditMode: true,
      editingCaseId: caseId,
      originalFiles: [...caseToEdit.files],
    }));

    return true;
  };

  // Setup edit mode with external data (from Supabase)
  const setupEditMode = (caseId: string, patient: PatientData, files: UploadedFile[]) => {
    // Initialize visited flags for existing files (they're already processed)
    const filesWithFlags = files.map(file => ({
      ...file,
      anonymizedVisited: file.anonymizedVisited ?? true,
      digitizedVisited: file.digitizedVisited ?? true,
    }));

    setState(prev => ({
      ...prev,
      currentPatient: patient,
      uploadedFiles: filesWithFlags,
      isEditMode: true,
      editingCaseId: caseId,
      originalFiles: [...files],
      editedFileIds: [],
    }));
  };

  const modifyCase = (): boolean => {
    if (!state.editingCaseId || !state.isEditMode) return false;

    setState(prev => {
      const updatedCases = prev.cases.map(c => {
        if (c.id === prev.editingCaseId) {
          return {
            ...c,
            patient: prev.currentPatient!,
            files: [...prev.uploadedFiles],
          };
        }
        return c;
      });

      return {
        ...prev,
        cases: updatedCases,
        isEditMode: false,
        editingCaseId: null,
        originalFiles: [],
        currentPatient: null,
        uploadedFiles: [],
        editedFileIds: [],
      };
    });

    return true;
  };

  // Send message to group chat (uses 'group' as expertId)
  const sendGroupMessage = (caseId: string, content: string) => {
    if (!state.loggedInUser) return;

    const chatKey = `${caseId}-group`;
    const message: ChatMessage = {
      id: generateId(),
      expertId: 'group',
      caseId,
      senderId: state.loggedInUser.id,
      content,
      timestamp: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      chats: {
        ...prev.chats,
        [chatKey]: [...(prev.chats[chatKey] || []), message],
      },
    }));
  };

  // Update current user profile
  const updateUser = (updates: Partial<User>) => {
    if (!state.loggedInUser) return;

    const updatedUser = { ...state.loggedInUser, ...updates };
    setState(prev => ({
      ...prev,
      loggedInUser: updatedUser,
      users: prev.users.map(u => (u.id === updatedUser.id ? updatedUser : u)),
    }));
  };

  // Initialize email change with OTP
  const initializeEmailChange = (newEmail: string) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP for email verification:', otp); // For testing
    
    setState(prev => ({
      ...prev,
      emailVerificationOtp: otp,
      emailVerificationPending: newEmail,
    }));
  };

  // Verify email OTP and complete email change
  const verifyEmailOTP = (inputOtp: string): boolean => {
    if (
      state.emailVerificationOtp === inputOtp &&
      state.emailVerificationPending &&
      state.loggedInUser
    ) {
      const updatedUser = {
        ...state.loggedInUser,
        email: state.emailVerificationPending,
      };

      setState(prev => ({
        ...prev,
        loggedInUser: updatedUser,
        users: prev.users.map(u =>
          u.id === updatedUser.id ? updatedUser : u
        ),
        emailVerificationOtp: null,
        emailVerificationPending: null,
      }));

      return true;
    }
    return false;
  };

  // Create a new MTB
  const createMTB = (name: string, dpImage: string | null, caseIds: string[]): MTB | null => {
    if (!state.loggedInUser) return null;

    const newMTB: MTB = {
      id: generateId(),
      name,
      doctorName: state.loggedInUser.name,
      description: `MTB created by ${state.loggedInUser.name}`,
      expertsCount: 0,
      casesCount: caseIds.length,
      isOwner: true,
      cases: caseIds,
      experts: [],
      dpImage: dpImage || undefined,
      ownerId: state.loggedInUser.id,
    };

    setState(prev => ({
      ...prev,
      mtbs: [...prev.mtbs, newMTB],
    }));

    return newMTB;
  };

  // Delete an MTB
  const deleteMTB = (mtbId: string) => {
    setState(prev => ({
      ...prev,
      mtbs: prev.mtbs.filter(m => m.id !== mtbId),
    }));
  };

  // Remove an expert from MTB
  const removeExpertFromMTB = (mtbId: string, expertId: string) => {
    setState(prev => ({
      ...prev,
      mtbs: prev.mtbs.map(mtb =>
        mtb.id === mtbId
          ? {
              ...mtb,
              experts: mtb.experts.filter(id => id !== expertId),
              expertsCount: mtb.experts.filter(id => id !== expertId).length,
            }
          : mtb
      ),
    }));
  };

  // Add cases to MTB
  const addCasesToMTB = (mtbId: string, caseIds: string[]) => {
    setState(prev => ({
      ...prev,
      mtbs: prev.mtbs.map(mtb =>
        mtb.id === mtbId
          ? {
              ...mtb,
              cases: [...mtb.cases, ...caseIds.filter(id => !mtb.cases.includes(id))],
              casesCount: [...mtb.cases, ...caseIds.filter(id => !mtb.cases.includes(id))].length,
            }
          : mtb
      ),
    }));
  };

  // Remove a case from an MTB (does NOT delete the global case)
  const removeCaseFromMTB = (mtbId: string, caseId: string) => {
    setState(prev => ({
      ...prev,
      mtbs: prev.mtbs.map(mtb =>
        mtb.id === mtbId
          ? {
              ...mtb,
              cases: mtb.cases.filter(id => id !== caseId),
              casesCount: mtb.cases.filter(id => id !== caseId).length,
            }
          : mtb
      ),
    }));
  };

  // Send invitations to expert emails
  const sendInvitations = (mtbId: string, mtbName: string, emails: string[]) => {
    if (!state.loggedInUser) return;

    const newInvitations: Invitation[] = emails.map(email => ({
      id: generateId(),
      mtb_id: mtbId,
      mtb_name: mtbName,
      invited_by_id: state.loggedInUser!.id,
      invited_by_name: state.loggedInUser!.name,
      invited_user_email: email,
      status: 'pending',
      read: false,
      created_at: new Date().toISOString(),
    }));

    setState(prev => ({
      ...prev,
      invitations: [...prev.invitations, ...newInvitations],
    }));
  };

  // Mark all invitations for current user as read
  const markInvitationsRead = () => {
    if (!state.loggedInUser) return;

    setState(prev => ({
      ...prev,
      invitations: prev.invitations.map(inv =>
        inv.invited_user_email === state.loggedInUser?.email
          ? { ...inv, read: true }
          : inv
      ),
    }));
  };

  // Accept an invitation
  const acceptInvitation = (invitation: Invitation) => {
    if (!state.loggedInUser) return;

    setState(prev => ({
      ...prev,
      // Update invitation status
      invitations: prev.invitations.map(inv =>
        inv.id === invitation.id ? { ...inv, status: 'accepted' as const } : inv
      ),
      // Add user as enrolled to the MTB
      mtbs: prev.mtbs.map(mtb =>
        mtb.id === invitation.mtb_id
          ? {
              ...mtb,
              expertsCount: mtb.expertsCount + 1,
            }
          : mtb
      ).concat(
        // Add the MTB to user's enrolled MTBs if not already there
        prev.mtbs.some(m => m.id === invitation.mtb_id && !m.isOwner)
          ? []
          : [{
              id: invitation.mtb_id + '_enrolled',
              name: invitation.mtb_name,
              doctorName: invitation.invited_by_name,
              description: `Enrolled MTB`,
              expertsCount: 0,
              casesCount: 0,
              isOwner: false,
              cases: [],
              experts: [],
            }]
      ),
    }));
  };

  // Decline an invitation
  const declineInvitation = (invitation: Invitation) => {
    setState(prev => ({
      ...prev,
      invitations: prev.invitations.map(inv =>
        inv.id === invitation.id ? { ...inv, status: 'declined' as const } : inv
      ),
    }));
  };

  return (
    <AppContext.Provider
      value={{
        state,
        login,
        signup,
        logout,
        verifyOTP,
        setOTPEmail,
        initializeEmailChange,
        verifyEmailOTP,
        setCurrentPatient,
        addUploadedFile,
        removeUploadedFile,
        updateFileCategory,
        updateFileName,
        updateFileExtractedData,
        updateAnonymizedImage,
        updateAnonymizedPDFPages,
        updatePDFPages,
        createCase,
        deleteCase,
        loadCaseForEditing,
        setupEditMode,
        modifyCase,
        sendMessage,
        sendGroupMessage,
        clearUploadedFiles,
        updateUser,
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
        createMTB,
        deleteMTB,
        removeExpertFromMTB,
        addCasesToMTB,
        removeCaseFromMTB,
        sendInvitations,
        markInvitationsRead,
        acceptInvitation,
        declineInvitation,
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

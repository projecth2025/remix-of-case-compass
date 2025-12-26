// Types for the VMTB application
// Note: These are frontend types. Backend types are in src/integrations/supabase/types.ts

export interface PatientData {
  name: string;
  age: string;
  sex: string;
  cancerType: string;
  caseName?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataURL: string;
  fileCategory: string;
  extractedData?: Record<string, string>;
  anonymizedDataURL?: string;
  anonymizedPages?: string[];
  pdfPages?: string[];
  mimeType?: string;
  pageIndex?: number;
  createdAt?: string;
  lastModifiedAt?: string;
  anonymizedVisited?: boolean;
  digitizedVisited?: boolean;
  anonymizedChangedAt?: string;
  uploadedAt?: string;
  visited?: boolean;
  dirty?: boolean;
  lastVisitedAt?: number;
}

export interface Case {
  id: string;
  caseName: string;
  patientId: string;
  patient: PatientData;
  files: UploadedFile[];
  status: 'Pending' | 'In Review' | 'Completed';
  createdDate: string;
  clinicalSummary?: string;
  ownerId?: string;
}

export interface Expert {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  expertId: string;
  caseId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface MTB {
  id: string;
  name: string;
  doctorName: string;
  description: string;
  expertsCount: number;
  casesCount: number;
  isOwner: boolean;
  cases: string[];
  experts: string[];
  dpImage?: string;
  ownerId?: string;
}

export interface Meeting {
  id: string;
  mtbId: string;
  mtbName: string;
  createdBy: string;
  title: string | null;
  scheduledDate: string;
  scheduledTime: string;
  scheduleType: 'once' | 'custom' | 'instant';
  repeatDays: number[] | null;
  meetingLink: string | null;
  status: 'scheduled' | 'in_progress' | 'ended' | 'cancelled';
  startedAt: string | null;
  createdAt: string;
}

export interface MeetingNotification {
  id: string;
  meetingId: string;
  userId: string;
  read: boolean;
  meeting?: Meeting;
  createdAt: string;
}

export interface Invitation {
  id: string;
  mtb_id: string;
  mtb_name: string;
  invited_by_id: string;
  invited_by_name: string;
  invited_user_email: string;
  status: 'pending' | 'accepted' | 'declined';
  read: boolean;
  created_at: string;
}

// Utility functions
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Mock extracted data generator for digitization
export const generateMockExtractedData = (fileCategory: string): Record<string, string> => {
  const commonFields: Record<string, Record<string, string>> = {
    'Clinical Notes': {
      'Patient History': 'Patient presents with persistent cough for 3 months',
      'Chief Complaint': 'Shortness of breath and chest pain',
      'Physical Examination': 'Decreased breath sounds in right lower lobe',
      'Assessment': 'Suspected lung malignancy',
      'Plan': 'Order CT scan and biopsy',
    },
    'Pathology': {
      'Specimen Type': 'Lung tissue biopsy',
      'Diagnosis': 'Non-small cell lung carcinoma',
      'Histologic Type': 'Adenocarcinoma',
      'Grade': 'Moderately differentiated',
      'Margins': 'Negative for malignancy',
    },
    'Radiology': {
      'Examination': 'CT Chest with contrast',
      'Findings': 'Right lower lobe mass 4.2 x 3.8 cm',
      'Lymph Nodes': 'Mediastinal lymphadenopathy noted',
      'Impression': 'Primary lung malignancy with nodal involvement',
      'Recommendation': 'PET scan for staging',
    },
    'Lab Results': {
      'Tumor Markers': 'CEA: 12.5 ng/mL (elevated)',
      'CBC': 'WBC 8.2, Hgb 11.5, Plt 245',
      'Metabolic Panel': 'Within normal limits',
      'LFTs': 'Mildly elevated ALT',
      'Creatinine': '1.1 mg/dL',
    },
    'Genomic Report': {
      'EGFR Mutation': 'Positive - Exon 19 deletion',
      'ALK Rearrangement': 'Negative',
      'ROS1': 'Negative',
      'PD-L1 Expression': '45%',
      'TMB': 'Intermediate (8 mut/Mb)',
    },
  };

  return commonFields[fileCategory] || {
    'Document Type': fileCategory,
    'Content Summary': 'Document uploaded successfully',
    'Status': 'Pending review',
  };
};

// VMTB Core Types - Medical-grade type definitions

export type Sex = 'male' | 'female' | 'other';

export type CancerType = 
  | 'breast'
  | 'lung'
  | 'colorectal'
  | 'prostate'
  | 'melanoma'
  | 'leukemia'
  | 'lymphoma'
  | 'pancreatic'
  | 'ovarian'
  | 'bladder'
  | 'kidney'
  | 'thyroid'
  | 'liver'
  | 'brain'
  | 'other';

export type DocumentType = 'image' | 'pdf';

export interface PatientMetadata {
  name: string;
  age: number;
  sex: Sex;
}

export interface CaseMetadata {
  caseName: string;
  cancerType: CancerType;
  notes?: string;
}

// Document in memory during creation flow (NOT persisted)
export interface TemporaryDocument {
  id: string;
  fileName: string;
  fileType: DocumentType;
  mimeType: string;
  file: File;
  previewUrl: string;
  pages: number; // For PDFs, multiple pages
  visitedInAnonymization: boolean;
  visitedInDigitization: boolean;
  anonymizedBlob?: Blob; // After anonymization
  digitizedText?: string; // After AI processing
}

// Persisted document (after case creation)
export interface PersistedDocument {
  id: string;
  caseId: string;
  fileName: string;
  fileType: DocumentType;
  storageUrl: string;
  digitizedText: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Case status
export type CaseStatus = 'draft' | 'active' | 'archived';

// Persisted case (in Supabase)
export interface Case {
  id: string;
  caseName: string;
  cancerType: CancerType;
  notes?: string;
  status: CaseStatus;
  patientId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// Persisted patient (anonymized in storage)
export interface Patient {
  id: string;
  displayName: string; // Anonymized identifier like "Patient-001"
  age: number;
  sex: Sex;
  createdAt: string;
}

// Expert/Doctor profile
export interface Expert {
  id: string;
  email: string;
  fullName: string;
  specialty?: string;
  institution?: string;
  avatarUrl?: string;
}

// MTB (Virtual Molecular Tumor Board)
export type MTBStatus = 'active' | 'completed' | 'cancelled';

export interface MTB {
  id: string;
  name: string;
  description?: string;
  status: MTBStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// MTB membership
export type MemberRole = 'owner' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface MTBMember {
  id: string;
  mtbId: string;
  expertId: string;
  role: MemberRole;
  invitationStatus: InvitationStatus;
  joinedAt?: string;
}

// MTB-Case association (reference only, no data ownership)
export interface MTBCase {
  id: string;
  mtbId: string;
  caseId: string;
  addedById: string;
  addedAt: string;
}

// Meeting
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Meeting {
  id: string;
  mtbId: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  googleMeetLink?: string;
  status: MeetingStatus;
  createdById: string;
  createdAt: string;
}

// Meeting response
export type AvailabilityResponse = 'available' | 'unavailable' | 'tentative';

export interface MeetingResponse {
  id: string;
  meetingId: string;
  expertId: string;
  availability: AvailabilityResponse;
  comment?: string;
  respondedAt: string;
}

// Audit log
export type AuditAction = 
  | 'case_created'
  | 'case_updated'
  | 'case_archived'
  | 'document_added'
  | 'document_modified'
  | 'document_removed'
  | 'mtb_created'
  | 'mtb_case_added'
  | 'mtb_member_invited'
  | 'mtb_member_accepted'
  | 'meeting_scheduled'
  | 'meeting_cancelled';

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: 'case' | 'document' | 'mtb' | 'meeting';
  entityId: string;
  performedById: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Create case flow steps
export type CreateCaseStep = 
  | 'metadata'
  | 'upload'
  | 'anonymization'
  | 'digitization'
  | 'review';

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  unverifiedDocuments?: string[];
}

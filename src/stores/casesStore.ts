import { create } from 'zustand';
import type { Case, Patient, PersistedDocument, Expert } from '@/types/vmtb';

// Mock data for demonstration (will be replaced with Supabase queries)
interface CasesState {
  cases: Case[];
  patients: Map<string, Patient>;
  documents: Map<string, PersistedDocument[]>; // caseId -> documents
  experts: Map<string, Expert[]>; // caseId -> assigned experts
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Selected case for viewing/editing
  selectedCaseId: string | null;
  
  // Actions (these will call Supabase in real implementation)
  setCases: (cases: Case[]) => void;
  setSelectedCase: (id: string | null) => void;
  getCaseById: (id: string) => Case | undefined;
  getPatientForCase: (patientId: string) => Patient | undefined;
  getDocumentsForCase: (caseId: string) => PersistedDocument[];
  getExpertsForCase: (caseId: string) => Expert[];
  
  // Mock data loader
  loadMockData: () => void;
}

export const useCasesStore = create<CasesState>((set, get) => ({
  cases: [],
  patients: new Map(),
  documents: new Map(),
  experts: new Map(),
  isLoading: false,
  error: null,
  selectedCaseId: null,

  setCases: (cases) => set({ cases }),

  setSelectedCase: (id) => set({ selectedCaseId: id }),

  getCaseById: (id) => get().cases.find((c) => c.id === id),

  getPatientForCase: (patientId) => get().patients.get(patientId),

  getDocumentsForCase: (caseId) => get().documents.get(caseId) || [],

  getExpertsForCase: (caseId) => get().experts.get(caseId) || [],

  loadMockData: () => {
    // Sample mock data for UI demonstration
    const mockPatients: Patient[] = [
      {
        id: 'patient_001',
        displayName: 'Patient-001',
        age: 58,
        sex: 'female',
        createdAt: '2024-01-15T10:30:00Z',
      },
      {
        id: 'patient_002',
        displayName: 'Patient-002',
        age: 67,
        sex: 'male',
        createdAt: '2024-01-20T14:15:00Z',
      },
      {
        id: 'patient_003',
        displayName: 'Patient-003',
        age: 45,
        sex: 'female',
        createdAt: '2024-02-01T09:00:00Z',
      },
    ];

    const mockCases: Case[] = [
      {
        id: 'case_001',
        caseName: 'BC-2024-001',
        cancerType: 'breast',
        notes: 'Triple negative breast cancer, stage IIIB. Pending genomic analysis.',
        status: 'active',
        patientId: 'patient_001',
        createdById: 'user_001',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-18T16:45:00Z',
      },
      {
        id: 'case_002',
        caseName: 'LC-2024-015',
        cancerType: 'lung',
        notes: 'Non-small cell lung cancer. EGFR mutation positive.',
        status: 'active',
        patientId: 'patient_002',
        createdById: 'user_001',
        createdAt: '2024-01-20T14:15:00Z',
        updatedAt: '2024-01-22T11:30:00Z',
      },
      {
        id: 'case_003',
        caseName: 'MEL-2024-008',
        cancerType: 'melanoma',
        notes: 'Metastatic melanoma. BRAF V600E mutation detected.',
        status: 'active',
        patientId: 'patient_003',
        createdById: 'user_001',
        createdAt: '2024-02-01T09:00:00Z',
        updatedAt: '2024-02-03T15:20:00Z',
      },
    ];

    const mockDocuments: Map<string, PersistedDocument[]> = new Map([
      [
        'case_001',
        [
          {
            id: 'doc_001',
            caseId: 'case_001',
            fileName: 'pathology_report.pdf',
            fileType: 'pdf',
            storageUrl: '/placeholder.svg',
            digitizedText: 'Invasive ductal carcinoma, Grade 3. ER negative, PR negative, HER2 negative (triple negative). Ki-67 proliferation index: 45%.',
            verified: true,
            createdAt: '2024-01-15T10:35:00Z',
            updatedAt: '2024-01-15T10:35:00Z',
          },
          {
            id: 'doc_002',
            caseId: 'case_001',
            fileName: 'ct_scan.png',
            fileType: 'image',
            storageUrl: '/placeholder.svg',
            digitizedText: 'CT thorax showing 3.2cm mass in left upper lobe with mediastinal lymphadenopathy. No distant metastases identified.',
            verified: true,
            createdAt: '2024-01-15T10:40:00Z',
            updatedAt: '2024-01-15T10:40:00Z',
          },
        ],
      ],
      [
        'case_002',
        [
          {
            id: 'doc_003',
            caseId: 'case_002',
            fileName: 'biopsy_results.pdf',
            fileType: 'pdf',
            storageUrl: '/placeholder.svg',
            digitizedText: 'Adenocarcinoma of the lung. EGFR exon 19 deletion detected. PDL-1 expression: 60%.',
            verified: true,
            createdAt: '2024-01-20T14:20:00Z',
            updatedAt: '2024-01-20T14:20:00Z',
          },
        ],
      ],
    ]);

    const patientsMap = new Map<string, Patient>();
    mockPatients.forEach((p) => patientsMap.set(p.id, p));

    set({
      cases: mockCases,
      patients: patientsMap,
      documents: mockDocuments,
    });
  },
}));

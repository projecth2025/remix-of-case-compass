import { create } from 'zustand';
import type { MTB, MTBMember, MTBCase, Meeting, MeetingResponse, Expert } from '@/types/vmtb';

interface MTBState {
  // MTBs
  mtbs: MTB[];
  members: Map<string, MTBMember[]>; // mtbId -> members
  mtbCases: Map<string, MTBCase[]>; // mtbId -> cases
  
  // Meetings
  meetings: Map<string, Meeting[]>; // mtbId -> meetings
  responses: Map<string, MeetingResponse[]>; // meetingId -> responses
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Selected MTB
  selectedMtbId: string | null;
  
  // Actions
  setMtbs: (mtbs: MTB[]) => void;
  setSelectedMtb: (id: string | null) => void;
  getMtbById: (id: string) => MTB | undefined;
  getMembersForMtb: (mtbId: string) => MTBMember[];
  getCasesForMtb: (mtbId: string) => MTBCase[];
  getMeetingsForMtb: (mtbId: string) => Meeting[];
  getResponsesForMeeting: (meetingId: string) => MeetingResponse[];
  
  // Mock data loader
  loadMockData: () => void;
}

export const useMTBStore = create<MTBState>((set, get) => ({
  mtbs: [],
  members: new Map(),
  mtbCases: new Map(),
  meetings: new Map(),
  responses: new Map(),
  isLoading: false,
  error: null,
  selectedMtbId: null,

  setMtbs: (mtbs) => set({ mtbs }),

  setSelectedMtb: (id) => set({ selectedMtbId: id }),

  getMtbById: (id) => get().mtbs.find((m) => m.id === id),

  getMembersForMtb: (mtbId) => get().members.get(mtbId) || [],

  getCasesForMtb: (mtbId) => get().mtbCases.get(mtbId) || [],

  getMeetingsForMtb: (mtbId) => get().meetings.get(mtbId) || [],

  getResponsesForMeeting: (meetingId) => get().responses.get(meetingId) || [],

  loadMockData: () => {
    const mockMtbs: MTB[] = [
      {
        id: 'mtb_001',
        name: 'Breast Cancer Board',
        description: 'Weekly review of complex breast cancer cases requiring multidisciplinary input.',
        status: 'active',
        createdById: 'user_001',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-25T14:30:00Z',
      },
      {
        id: 'mtb_002',
        name: 'Thoracic Oncology MTB',
        description: 'Lung and thoracic cancer cases for treatment planning.',
        status: 'active',
        createdById: 'user_001',
        createdAt: '2024-01-12T11:00:00Z',
        updatedAt: '2024-01-28T10:15:00Z',
      },
      {
        id: 'mtb_003',
        name: 'Melanoma Task Force',
        description: 'Advanced melanoma cases with immunotherapy considerations.',
        status: 'active',
        createdById: 'user_001',
        createdAt: '2024-02-01T08:00:00Z',
        updatedAt: '2024-02-05T16:45:00Z',
      },
    ];

    const mockMeetings: Map<string, Meeting[]> = new Map([
      [
        'mtb_001',
        [
          {
            id: 'meeting_001',
            mtbId: 'mtb_001',
            title: 'Weekly Case Review',
            scheduledAt: '2024-02-15T14:00:00Z',
            durationMinutes: 60,
            googleMeetLink: 'https://meet.google.com/abc-defg-hij',
            status: 'scheduled',
            createdById: 'user_001',
            createdAt: '2024-02-10T09:00:00Z',
          },
        ],
      ],
      [
        'mtb_002',
        [
          {
            id: 'meeting_002',
            mtbId: 'mtb_002',
            title: 'EGFR+ Case Discussion',
            scheduledAt: '2024-02-16T10:00:00Z',
            durationMinutes: 90,
            googleMeetLink: 'https://meet.google.com/klm-nopq-rst',
            status: 'scheduled',
            createdById: 'user_001',
            createdAt: '2024-02-11T11:30:00Z',
          },
        ],
      ],
    ]);

    const mockMtbCases: Map<string, MTBCase[]> = new Map([
      [
        'mtb_001',
        [
          {
            id: 'mtbcase_001',
            mtbId: 'mtb_001',
            caseId: 'case_001',
            addedById: 'user_001',
            addedAt: '2024-01-15T11:00:00Z',
          },
        ],
      ],
      [
        'mtb_002',
        [
          {
            id: 'mtbcase_002',
            mtbId: 'mtb_002',
            caseId: 'case_002',
            addedById: 'user_001',
            addedAt: '2024-01-20T15:00:00Z',
          },
        ],
      ],
      [
        'mtb_003',
        [
          {
            id: 'mtbcase_003',
            mtbId: 'mtb_003',
            caseId: 'case_003',
            addedById: 'user_001',
            addedAt: '2024-02-01T10:00:00Z',
          },
        ],
      ],
    ]);

    set({
      mtbs: mockMtbs,
      meetings: mockMeetings,
      mtbCases: mockMtbCases,
    });
  },
}));

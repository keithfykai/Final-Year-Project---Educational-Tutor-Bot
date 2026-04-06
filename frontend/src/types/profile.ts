export type ProfileChangeLogEntry = {
  timestamp: string;
  field: string;
  before: string | string[];
  after: string | string[];
  source: 'ai' | 'user';
};

export type StudentProfile = {
  userId: string;
  name: string;
  educationalLevel: string;
  subjectsStudying: string[];
  learningGoals: string[];
  weakAreas: string[];
  strengths: string[];
  learningPreferences: string[];
  notes: string;
  profileSummary?: string;
  createdAt?: string;
  updatedAt?: string;
  source?: {
    manuallyEdited?: boolean;
    manuallyEditedFields?: string[];
    aiUpdated?: boolean;
    lastAiUpdateAt?: string;
  };
  changeLog?: ProfileChangeLogEntry[];
};

export const EMPTY_PROFILE: Omit<StudentProfile, 'userId'> = {
  name: '',
  educationalLevel: '',
  subjectsStudying: [],
  learningGoals: [],
  weakAreas: [],
  strengths: [],
  learningPreferences: [],
  notes: '',
  profileSummary: '',
};

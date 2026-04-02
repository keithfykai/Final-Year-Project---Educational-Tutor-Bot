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
    aiUpdated?: boolean;
    lastAiUpdateAt?: string;
  };
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

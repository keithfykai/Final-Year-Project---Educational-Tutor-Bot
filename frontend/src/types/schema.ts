import type { Timestamp } from "firebase/firestore";

// ─── User document ───────────────────────────────────────────────────────────
export interface UserDoc {
  email: string;
  displayName: string;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  migrationVersion: number; // 0 = not migrated, 1 = migrated to session schema
}

// ─── Profile ─────────────────────────────────────────────────────────────────
export type EducationLevel = "psle" | "o_level" | "a_level" | "ib";
export type ExplanationStyle = "concise" | "detailed" | "worked_examples";

export interface ProfileDoc {
  level: EducationLevel | null;
  examYear: number | null;
  strengths: string[];         // max 10, additive-only
  weaknesses: string[];        // max 10, additive-only
  preferredExplanationStyle: ExplanationStyle | null;
  lastUpdatedAt: Timestamp;
  profileSummary: string;      // ≤500 chars, injected into chat system prompt
}

// ─── Chat Sessions ───────────────────────────────────────────────────────────
export interface ChatSession {
  title: string;
  level: EducationLevel | null;
  subject: string | null;
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
  messageCount: number;
  isArchived: boolean;
  topicsDetected: string[];
}

export type MessageSender = "user" | "bot" | "system";

export interface ChatMessage {
  sender: MessageSender;
  text: string;
  timestamp: Timestamp;
  imageUrl: string | null;
}

// ─── Topic Progress ───────────────────────────────────────────────────────────
export type TopicStatus =
  | "not_started"
  | "studied"
  | "practiced"
  | "mastered"
  | "struggling";

export interface TopicProgressEntry {
  displayName: string;
  status: TopicStatus;
  lastActivityAt: Timestamp | null;
  quizScore: number | null;       // 0–100
  chatSessionCount: number;
}

export interface TopicProgressDoc {
  level: string;
  subject: string;
  lastUpdatedAt: Timestamp;
  topics: Record<string, TopicProgressEntry>;
}

// ─── Quiz History ─────────────────────────────────────────────────────────────
export type QuizType = "mcq" | "open_ended";

export interface QuizHistoryDoc {
  level: string;
  subject: string;
  quizType: QuizType;
  totalQuestions: number;
  correctCount: number;
  score: number | null;          // 0–100 for open-ended
  wrongTopics: string[];
  completedAt: Timestamp;
  summaryText: string;
  sessionId: string | null;
}

// ─── Topic Curriculum (global) ────────────────────────────────────────────────
export interface CurriculumTopic {
  key: string;
  displayName: string;
  order: number;
  parentTopic: string | null;
}

export interface TopicCurriculumDoc {
  level: string;
  subject: string;
  lastUpdatedAt: Timestamp;
  topics: CurriculumTopic[];
}

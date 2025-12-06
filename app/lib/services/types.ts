// Database types - these are the core types used by services
// They're slightly different from the frontend types to match DB structure

export type QuestionType = "mcq" | "saq";

// Database row types
export interface DBUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  streak: number;
  last_active: string; // ISO date string
  created_at: string;
  exam_date: string | null; // ISO date string for cram mode
}

export interface DBQuestion {
  id: number;
  type: QuestionType;
  question: string;
  created_by: string;
  created_at: string;
}

export interface DBMCQOption {
  id: string;
  question_id: number;
  text: string;
  vote_count: number;
}

export interface DBSAQAnswer {
  id: string;
  question_id: number;
  text: string;
  vote_count: number;
  created_by: string;
  created_at: string;
}

export interface DBVote {
  id: number;
  user_id: string;
  question_id: number;
  option_id: string | null; // For MCQ
  answer_id: string | null; // For SAQ
  created_at: string;
}

export interface DBUserHistory {
  id: string;
  user_id: string;
  question_id: number;
  question_type: QuestionType;
  user_answer: string;
  consensus_answer: string;
  is_correct: boolean;
  answered_at: string;
}

export interface DBQuestionMastery {
  id: string;
  user_id: string;
  question_id: number;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string | null;
  last_reviewed_at: string | null;
  quality_sum: number;
  review_count: number;
}

// Service response types (frontend-friendly)
export interface MCQOption {
  id: string;
  text: string;
  votes: number;
}

export interface SAQAnswer {
  id: string;
  text: string;
  votes: number;
  createdBy: string;
  createdAt: Date;
}

export interface Question {
  id: number;
  type: QuestionType;
  question: string;
  createdBy: string;
  createdAt: Date;
  options?: MCQOption[]; // For MCQ
  answers?: SAQAnswer[]; // For SAQ
}

export interface UserStats {
  totalAnswered: number;
  correctAnswers: number;
  mcqAnswered: number;
  mcqCorrect: number;
  saqAnswered: number;
  saqCorrect: number;
  streak: number;
  lastActive: Date;
}

export interface AnswerHistory {
  id: string;
  questionId: number;
  questionText: string;
  questionType: QuestionType;
  userAnswer: string;
  consensusAnswer: string;
  isCorrect: boolean;
  answeredAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  stats: UserStats;
  history: AnswerHistory[];
  joinedAt: Date;
  examDate: string | null; // ISO date string for cram mode
}

// Create/Update DTOs
export interface CreateMCQQuestionDTO {
  question: string;
  createdBy: string;
  options: { id: string; text: string }[];
}

export interface CreateSAQQuestionDTO {
  question: string;
  createdBy: string;
}

export interface CreateSAQAnswerDTO {
  questionId: number;
  text: string;
  createdBy: string;
}

export interface CreateUserDTO {
  id: string;
  name: string;
  email: string;
}

export interface RecordHistoryDTO {
  userId: string;
  questionId: number;
  questionType: QuestionType;
  userAnswer: string;
  consensusAnswer: string;
  isCorrect: boolean;
}

// Mastery level categories for display
export type MasteryLevel = "new" | "learning" | "reviewing" | "mastered";

// Spaced repetition types
export interface QuestionMastery {
  questionId: number;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: Date | null;
  lastReviewedAt: Date | null;
  masteryLevel: MasteryLevel;
  reviewCount: number;
}

export interface MasteryStats {
  totalQuestions: number;
  newCount: number;
  learningCount: number;
  reviewingCount: number;
  masteredCount: number;
  averageEaseFactor: number;
  dueToday: number;
  overduCount: number;
}

export interface UpdateMasteryDTO {
  userId: string;
  questionId: number;
  isCorrect: boolean;
  isCramMode?: boolean;
  cramDays?: number;
}

// Practice mode types
export type PracticeMode = "random" | "smart" | "cram";

export interface PracticeSettings {
  mode: PracticeMode;
  questionType: QuestionType | "all";
  count: number;
  cramDays?: number; // Days until exam (1-7) for cram mode
}


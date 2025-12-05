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


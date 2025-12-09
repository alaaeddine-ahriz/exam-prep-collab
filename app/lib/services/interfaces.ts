// Service interfaces - implement these for SQLite, Supabase, etc.

import {
  Question,
  User,
  UserStats,
  AnswerHistory,
  CreateMCQQuestionDTO,
  CreateSAQQuestionDTO,
  CreateSAQAnswerDTO,
  CreateUserDTO,
  RecordHistoryDTO,
  QuestionType,
} from "./types";

export interface IQuestionService {
  // Read operations
  getAllQuestions(): Promise<Question[]>;
  getQuestionById(id: number): Promise<Question | null>;
  getQuestionsByType(type: QuestionType): Promise<Question[]>;
  searchQuestions(query: string): Promise<Question[]>;

  // Write operations
  createMCQQuestion(dto: CreateMCQQuestionDTO): Promise<Question>;
  createSAQQuestion(dto: CreateSAQQuestionDTO): Promise<Question>;
  addSAQAnswer(dto: CreateSAQAnswerDTO): Promise<Question>;

  // Voting
  voteOnMCQOption(questionId: number, optionId: string, userId: string): Promise<void>;
  voteOnSAQAnswer(questionId: number, answerId: string, userId: string): Promise<void>;
  hasUserVoted(userId: string, questionId: number): Promise<boolean>;
  getUserVote(userId: string, questionId: number): Promise<{ optionId?: string; answerId?: string } | null>;
  getAllUserVotes(userId: string): Promise<Record<number, { optionId?: string; answerId?: string }>>;
  changeVote(userId: string, questionId: number, newOptionId?: string, newAnswerId?: string): Promise<void>;
}

export interface IUserService {
  // Read operations
  getUserById(id: string): Promise<User | null>;
  getUserStats(userId: string): Promise<UserStats>;
  getUserHistory(userId: string, limit?: number): Promise<AnswerHistory[]>;

  // Write operations
  createUser(dto: CreateUserDTO): Promise<User>;
  updateStreak(userId: string, streak: number): Promise<void>;
  updateLastActive(userId: string): Promise<void>;
  updateExamDate(userId: string, examDate: string | null): Promise<void>;

  // History
  recordHistory(dto: RecordHistoryDTO): Promise<void>;
}

// Combined service interface for easy dependency injection
export interface IDataService {
  questions: IQuestionService;
  users: IUserService;

  // Lifecycle methods
  initialize(): Promise<void>;
  close(): Promise<void>;
}


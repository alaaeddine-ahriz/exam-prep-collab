"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Question, User, AnswerHistory } from "../lib/services/types";

const DEFAULT_USER_ID = "default-user";

// User votes by question ID
type UserVotes = Record<number, { optionId?: string; answerId?: string }>;

interface AppContextType {
  questions: Question[];
  user: User | null;
  userVotes: UserVotes;
  loading: boolean;
  error: string | null;
  
  // Question operations
  refreshQuestions: () => Promise<void>;
  addQuestion: (question: { type: "mcq" | "saq"; question: string; createdBy: string; options?: { id: string; text: string }[] }) => Promise<Question | null>;
  voteOnMCQ: (questionId: number, optionId: string) => Promise<void>;
  voteOnSAQ: (questionId: number, answerId: string) => Promise<void>;
  addSAQAnswer: (questionId: number, answerText: string) => Promise<void>;
  getQuestion: (id: number) => Question | undefined;
  getUserVoteForQuestion: (questionId: number) => { optionId?: string; answerId?: string } | null;
  
  // User operations
  refreshUser: () => Promise<void>;
  addToHistory: (entry: Omit<AnswerHistory, "id">) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userVotes, setUserVotes] = useState<UserVotes>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch questions from API
  const refreshQuestions = useCallback(async () => {
    try {
      const response = await fetch("/api/questions");
      if (!response.ok) throw new Error("Failed to fetch questions");
      const data = await response.json();
      // Convert date strings to Date objects
      const questionsWithDates = data.map((q: Question) => ({
        ...q,
        createdAt: new Date(q.createdAt),
        answers: q.answers?.map((a) => ({
          ...a,
          createdAt: new Date(a.createdAt),
        })),
      }));
      setQuestions(questionsWithDates);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Failed to load questions");
    }
  }, []);

  // Fetch user from API
  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${DEFAULT_USER_ID}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      const data = await response.json();
      // Convert date strings to Date objects
      setUser({
        ...data,
        joinedAt: new Date(data.joinedAt),
        stats: {
          ...data.stats,
          lastActive: new Date(data.stats.lastActive),
        },
        history: data.history.map((h: AnswerHistory) => ({
          ...h,
          answeredAt: new Date(h.answeredAt),
        })),
      });
    } catch (err) {
      console.error("Error fetching user:", err);
      setError("Failed to load user");
    }
  }, []);

  // Fetch user votes
  const refreshUserVotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${DEFAULT_USER_ID}/votes`);
      if (!response.ok) throw new Error("Failed to fetch votes");
      const data = await response.json();
      setUserVotes(data);
    } catch (err) {
      console.error("Error fetching votes:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([refreshQuestions(), refreshUser(), refreshUserVotes()]);
      setLoading(false);
    };
    loadData();
  }, [refreshQuestions, refreshUser, refreshUserVotes]);

  // Add question
  const addQuestion = async (questionData: { 
    type: "mcq" | "saq"; 
    question: string; 
    createdBy: string; 
    options?: { id: string; text: string }[] 
  }): Promise<Question | null> => {
    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionData),
      });
      if (!response.ok) throw new Error("Failed to create question");
      const newQuestion = await response.json();
      await refreshQuestions();
      return newQuestion;
    } catch (err) {
      console.error("Error creating question:", err);
      setError("Failed to create question");
      return null;
    }
  };

  // Vote on MCQ (supports changing vote)
  const voteOnMCQ = async (questionId: number, optionId: string) => {
    try {
      // Optimistically update local state
      setUserVotes(prev => ({
        ...prev,
        [questionId]: { optionId }
      }));

      const response = await fetch(`/api/questions/${questionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "mcq", optionId, userId: DEFAULT_USER_ID }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to vote");
      }
      
      await refreshQuestions();
    } catch (err) {
      console.error("Error voting:", err);
      // Revert on error
      await refreshUserVotes();
    }
  };

  // Vote on SAQ (supports changing vote)
  const voteOnSAQ = async (questionId: number, answerId: string) => {
    try {
      // Optimistically update local state
      setUserVotes(prev => ({
        ...prev,
        [questionId]: { answerId }
      }));

      const response = await fetch(`/api/questions/${questionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "saq", answerId, userId: DEFAULT_USER_ID }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to vote");
      }
      
      await refreshQuestions();
    } catch (err) {
      console.error("Error voting:", err);
      // Revert on error
      await refreshUserVotes();
    }
  };

  // Add SAQ answer
  const addSAQAnswer = async (questionId: number, answerText: string) => {
    try {
      const response = await fetch(`/api/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: answerText, createdBy: user?.name || "Anonymous" }),
      });
      if (!response.ok) throw new Error("Failed to add answer");
      await refreshQuestions();
    } catch (err) {
      console.error("Error adding answer:", err);
      setError("Failed to add answer");
    }
  };

  // Get question by ID
  const getQuestion = (id: number) => {
    return questions.find((q) => q.id === id);
  };

  // Get user's vote for a question
  const getUserVoteForQuestion = (questionId: number) => {
    return userVotes[questionId] || null;
  };

  // Add to history
  const addToHistory = async (entry: Omit<AnswerHistory, "id">) => {
    try {
      const response = await fetch(`/api/users/${DEFAULT_USER_ID}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!response.ok) throw new Error("Failed to record history");
      await refreshUser();
    } catch (err) {
      console.error("Error recording history:", err);
    }
  };

  const value: AppContextType = {
    questions,
    user,
    userVotes,
    loading,
    error,
    refreshQuestions,
    addQuestion,
    voteOnMCQ,
    voteOnSAQ,
    addSAQAnswer,
    getQuestion,
    getUserVoteForQuestion,
    refreshUser,
    addToHistory,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Question, User, AnswerHistory } from "../lib/services/types";
import { useAuth } from "./AuthContext";

// User votes by question ID
type UserVotes = Record<number, { optionId?: string; answerId?: string }>;

interface AppContextType {
  questions: Question[];
  user: User | null;
  userVotes: UserVotes;
  loading: boolean;
  error: string | null;
  currentUserName: string;
  
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
  const { user: authUser } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userVotes, setUserVotes] = useState<UserVotes>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track pending operations to prevent duplicates
  const [pendingVotes, setPendingVotes] = useState<Set<number>>(new Set());
  const [pendingAnswers, setPendingAnswers] = useState<Set<number>>(new Set());
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // Get the current user ID from auth, or use a local ID for unauthenticated users
  const getCurrentUserId = useCallback(() => {
    return authUser?.id || "local-user";
  }, [authUser]);

  // Get the display name for the current user
  const getCurrentUserName = useCallback(() => {
    if (authUser?.email) {
      return authUser.email.split("@")[0];
    }
    return "Anonymous";
  }, [authUser]);

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
    const userId = getCurrentUserId();
    try {
      const response = await fetch(`/api/users/${userId}`);
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
  }, [getCurrentUserId]);

  // Fetch user votes
  const refreshUserVotes = useCallback(async () => {
    const userId = getCurrentUserId();
    try {
      const response = await fetch(`/api/users/${userId}/votes`);
      if (!response.ok) throw new Error("Failed to fetch votes");
      const data = await response.json();
      setUserVotes(data);
    } catch (err) {
      console.error("Error fetching votes:", err);
    }
  }, [getCurrentUserId]);

  // Initial load and reload when auth user changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([refreshQuestions(), refreshUser(), refreshUserVotes()]);
      setLoading(false);
    };
    loadData();
  }, [refreshQuestions, refreshUser, refreshUserVotes, authUser?.id]);

  // Add question
  const addQuestion = async (questionData: { 
    type: "mcq" | "saq"; 
    question: string; 
    createdBy: string; 
    options?: { id: string; text: string }[] 
  }): Promise<Question | null> => {
    // Prevent duplicate submissions
    if (isAddingQuestion) return null;
    
    setIsAddingQuestion(true);
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
    } finally {
      setIsAddingQuestion(false);
    }
  };

  // Vote on MCQ (supports changing vote)
  const voteOnMCQ = async (questionId: number, optionId: string) => {
    // Prevent duplicate votes
    if (pendingVotes.has(questionId)) return;
    
    const userId = getCurrentUserId();
    setPendingVotes(prev => new Set(prev).add(questionId));
    try {
      // Optimistically update local state
      setUserVotes(prev => ({
        ...prev,
        [questionId]: { optionId }
      }));

      const response = await fetch(`/api/questions/${questionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "mcq", optionId, userId }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to vote");
      }
      
      await refreshQuestions();
    } catch (err) {
      console.error("Error voting:", err);
      // Revert on error
      await refreshUserVotes();
    } finally {
      setPendingVotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  // Vote on SAQ (supports changing vote)
  const voteOnSAQ = async (questionId: number, answerId: string) => {
    // Prevent duplicate votes
    if (pendingVotes.has(questionId)) return;
    
    const userId = getCurrentUserId();
    setPendingVotes(prev => new Set(prev).add(questionId));
    try {
      // Optimistically update local state
      setUserVotes(prev => ({
        ...prev,
        [questionId]: { answerId }
      }));

      const response = await fetch(`/api/questions/${questionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "saq", answerId, userId }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to vote");
      }
      
      await refreshQuestions();
    } catch (err) {
      console.error("Error voting:", err);
      // Revert on error
      await refreshUserVotes();
    } finally {
      setPendingVotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  // Add SAQ answer
  const addSAQAnswer = async (questionId: number, answerText: string) => {
    // Prevent duplicate submissions
    if (pendingAnswers.has(questionId)) return;
    
    const userName = getCurrentUserName();
    setPendingAnswers(prev => new Set(prev).add(questionId));
    try {
      const response = await fetch(`/api/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: answerText, createdBy: userName }),
      });
      if (!response.ok) throw new Error("Failed to add answer");
      await refreshQuestions();
    } catch (err) {
      console.error("Error adding answer:", err);
      setError("Failed to add answer");
    } finally {
      setPendingAnswers(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
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
    const userId = getCurrentUserId();
    try {
      const response = await fetch(`/api/users/${userId}/history`, {
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
    currentUserName: getCurrentUserName(),
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

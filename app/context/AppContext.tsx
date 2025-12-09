"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { Question, User, AnswerHistory, QuestionMastery, MasteryStats, PracticeMode } from "../lib/services/types";
import { useAuth } from "./AuthContext";
import { useTokenToast } from "../components";

// User votes by question ID
type UserVotes = Record<number, { optionId?: string; answerId?: string }>;

// Study mode settings (synced via database)
interface StudyModeSettings {
  examDate: string | null; // ISO date string
  isEnabled: boolean;
}

// Currency balance info
interface CurrencyInfo {
  balance: number;
  canClaimDailyBonus: boolean;
  practiceSessionsUsedToday: number;
  freeSessionsRemaining: number;
  requiresPaymentForPractice: boolean;
  config: {
    currencyName: string;
    practiceSessionCost: number;
    aiVerificationCost: number;
    aiExplanationCost: number;
    dailyLoginReward: number;
    voteReward: number;
    answerReward: number;
    freePracticeSessionsPerDay: number;
  };
}

interface AppContextType {
  questions: Question[];
  user: User | null;
  userVotes: UserVotes;
  initialLoading: boolean;  // True only during first app load
  isRefreshing: boolean;    // True when refreshing data in background
  error: string | null;
  currentUserName: string;

  // Mastery state
  mastery: QuestionMastery[];
  masteryStats: MasteryStats | null;

  // Study mode (global cram mode)
  studyMode: StudyModeSettings;
  isCramModeActive: boolean;
  daysUntilExam: number | null;
  setExamDate: (date: Date | null) => void;

  // Currency state
  currencyInfo: CurrencyInfo | null;
  refreshCurrency: () => Promise<void>;
  claimDailyBonus: () => Promise<{ success: boolean; amount?: number }>;

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

  // Mastery operations
  refreshMastery: (force?: boolean) => Promise<void>;
  getMasteryForQuestion: (questionId: number) => QuestionMastery | null;
  getPracticeQuestions: (questionType: "all" | "mcq" | "saq", count: number) => Promise<number[]>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to calculate days until exam
const calculateDaysUntilExam = (examDateStr: string | null): number | null => {
  if (!examDateStr) return null;
  const examDate = new Date(examDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  examDate.setHours(0, 0, 0, 0);
  const diffTime = examDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser, loading: authLoading } = useAuth();
  const { showTokenToast } = useTokenToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userVotes, setUserVotes] = useState<UserVotes>({});
  const [mastery, setMastery] = useState<QuestionMastery[]>([]);
  const [masteryStats, setMasteryStats] = useState<MasteryStats | null>(null);
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track pending operations to prevent duplicates
  const [pendingVotes, setPendingVotes] = useState<Set<number>>(new Set());
  const [pendingAnswers, setPendingAnswers] = useState<Set<number>>(new Set());
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // Ref to track if mastery was already loaded (to prevent re-fetches during quiz)
  const masteryLoadedRef = useRef(false);

  // Study mode derived from user data (synced via database)
  const studyMode: StudyModeSettings = {
    examDate: user?.examDate || null,
    isEnabled: user?.examDate !== null && user?.examDate !== undefined,
  };

  // Calculate derived study mode values
  const daysUntilExam = calculateDaysUntilExam(studyMode.examDate);
  const isCramModeActive = studyMode.isEnabled && daysUntilExam !== null && daysUntilExam >= 0 && daysUntilExam <= 7;

  // Get the current user ID from auth, or use a local ID for unauthenticated users
  const getCurrentUserId = useCallback(() => {
    return authUser?.id || "local-user";
  }, [authUser]);

  // Get the display name for the current user - prefer saved name over email prefix
  const getCurrentUserName = useCallback(() => {
    // First try the saved name from the database
    if (user?.name) {
      return user.name;
    }
    // Fall back to email prefix
    if (authUser?.email) {
      return authUser.email.split("@")[0];
    }
    return "Anonymous";
  }, [authUser, user]);

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
      // Pass the user's email as a header so the API can use it for user creation
      const headers: HeadersInit = {};
      if (authUser?.email) {
        headers["x-user-email"] = authUser.email;
      }

      const response = await fetch(`/api/users/${userId}`, { headers });
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
  }, [getCurrentUserId, authUser?.email]);

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

  // Fetch currency balance
  const refreshCurrency = useCallback(async () => {
    const userId = getCurrentUserId();
    try {
      const response = await fetch(`/api/users/${userId}/balance`);
      if (!response.ok) throw new Error("Failed to fetch balance");
      const data = await response.json();
      setCurrencyInfo(data);
    } catch (err) {
      console.error("Error fetching currency:", err);
    }
  }, [getCurrentUserId]);

  // Claim daily bonus
  const claimDailyBonus = useCallback(async (): Promise<{ success: boolean; amount?: number }> => {
    const userId = getCurrentUserId();

    // Optimistically update UI to hide the claim button immediately
    setCurrencyInfo(prev => prev ? { ...prev, canClaimDailyBonus: false } : prev);

    try {
      const response = await fetch(`/api/users/${userId}/balance/claim-daily`, {
        method: "POST",
      });

      if (!response.ok) {
        if (response.status === 409) {
          // Already claimed - refresh to get correct state
          await refreshCurrency();
          return { success: false };
        }
        // Revert optimistic update on error
        setCurrencyInfo(prev => prev ? { ...prev, canClaimDailyBonus: true } : prev);
        throw new Error("Failed to claim bonus");
      }

      const data = await response.json();

      // Update balance with the new value from the response
      setCurrencyInfo(prev => prev ? {
        ...prev,
        balance: data.newBalance,
        canClaimDailyBonus: false
      } : prev);

      // Show toast for daily bonus
      if (data.amount) {
        showTokenToast(data.amount, "Daily login bonus");
      }

      return { success: true, amount: data.amount };
    } catch (err) {
      console.error("Error claiming daily bonus:", err);
      return { success: false };
    }
  }, [getCurrentUserId, refreshCurrency, showTokenToast]);

  // Fetch mastery data
  const refreshMastery = useCallback(async (force: boolean = false) => {
    // Skip if already loaded and not forcing
    if (masteryLoadedRef.current && !force) return;

    const userId = getCurrentUserId();
    try {
      // Fetch individual mastery records
      const response = await fetch(`/api/users/${userId}/mastery`);
      if (!response.ok) throw new Error("Failed to fetch mastery");
      const data = await response.json();

      // Convert date strings to Date objects
      const masteryWithDates = (data || []).map((m: QuestionMastery) => ({
        ...m,
        nextReviewAt: m.nextReviewAt ? new Date(m.nextReviewAt) : null,
        lastReviewedAt: m.lastReviewedAt ? new Date(m.lastReviewedAt) : null,
      }));
      setMastery(masteryWithDates);
      masteryLoadedRef.current = true;

      // Fetch aggregate stats
      const statsResponse = await fetch(
        `/api/users/${userId}/mastery?stats=true&totalQuestions=${questions.length}`
      );
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setMasteryStats(statsData);
      }
    } catch (err) {
      console.error("Error fetching mastery:", err);
    }
  }, [getCurrentUserId, questions.length]);

  // Track if initial load has completed
  const initialLoadCompleteRef = useRef(false);
  // Track the auth user ID that was used for the initial load
  const loadedForUserRef = useRef<string | null>(null);

  // Initial load - runs only once on mount, and when auth user changes
  useEffect(() => {
    // Don't fetch until auth is ready
    if (authLoading) return;

    // Skip if already loaded for this user (prevents duplicate loads on re-renders)
    const currentUserId = authUser?.id || null;
    if (initialLoadCompleteRef.current && loadedForUserRef.current === currentUserId) {
      return;
    }

    const loadData = async () => {
      const isInitialLoad = !initialLoadCompleteRef.current;
      if (isInitialLoad) {
        setInitialLoading(true);
      }

      // Always fetch questions (not user-specific)
      await refreshQuestions();

      // Only fetch user-specific data if authenticated
      if (authUser?.id) {
        await Promise.all([refreshUser(), refreshUserVotes(), refreshCurrency()]);
      } else {
        // Reset user-specific state when not authenticated
        setUser(null);
        setUserVotes({});
        setCurrencyInfo(null);
      }

      setInitialLoading(false);
      initialLoadCompleteRef.current = true;
      loadedForUserRef.current = currentUserId;
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id, authLoading]);

  // Load mastery after questions are loaded
  useEffect(() => {
    if (questions.length > 0) {
      refreshMastery();
    }
  }, [questions.length, refreshMastery]);

  // Auto-disable cram mode if exam date has passed
  useEffect(() => {
    if (studyMode.isEnabled && daysUntilExam !== null && daysUntilExam < 0) {
      // Exam date passed, disable cram mode
      const userId = getCurrentUserId();
      fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_date: null }),
      }).then(() => refreshUser()).catch(console.error);
    }
  }, [studyMode.isEnabled, daysUntilExam, getCurrentUserId, refreshUser]);

  // Set exam date function (saves to database)
  const setExamDate = useCallback(async (date: Date | null) => {
    const userId = getCurrentUserId();
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_date: date ? date.toISOString() : null }),
      });
      if (!response.ok) throw new Error("Failed to update exam date");
      await refreshUser(); // Refresh user to get updated exam_date
    } catch (err) {
      console.error("Error setting exam date:", err);
    }
  }, [getCurrentUserId, refreshUser]);

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

      const data = await response.json();

      // Show toast and update balance if tokens were awarded (first vote on this question)
      if (data.tokensAwarded !== undefined && currencyInfo) {
        const reward = currencyInfo.config.voteReward;
        showTokenToast(reward, "Voted on answer");
        // Update balance immediately from response
        setCurrencyInfo(prev => prev ? { ...prev, balance: data.tokensAwarded } : prev);
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

      const data = await response.json();

      // Show toast and update balance if tokens were awarded (first vote on this question)
      if (data.tokensAwarded !== undefined && currencyInfo) {
        const reward = currencyInfo.config.voteReward;
        showTokenToast(reward, "Voted on answer");
        // Update balance immediately from response
        setCurrencyInfo(prev => prev ? { ...prev, balance: data.tokensAwarded } : prev);
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
    const userId = getCurrentUserId();
    setPendingAnswers(prev => new Set(prev).add(questionId));
    try {
      const response = await fetch(`/api/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: answerText, createdBy: userName, userId }),
      });
      if (!response.ok) throw new Error("Failed to add answer");

      const data = await response.json();

      // Show toast and update balance if tokens were awarded
      if (data.tokensAwarded !== undefined && currencyInfo) {
        const reward = currencyInfo.config.answerReward;
        showTokenToast(reward, "Submitted answer");
        // Update balance immediately from response
        setCurrencyInfo(prev => prev ? { ...prev, balance: data.tokensAwarded } : prev);
      }

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

  // Add to history and update mastery
  const addToHistory = async (entry: Omit<AnswerHistory, "id">) => {
    const userId = getCurrentUserId();
    try {
      // Record history
      const response = await fetch(`/api/users/${userId}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!response.ok) throw new Error("Failed to record history");

      // Update mastery (spaced repetition) - use global cram mode setting
      const masteryResponse = await fetch(`/api/users/${userId}/mastery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: entry.questionId,
          isCorrect: entry.isCorrect,
          isCramMode: isCramModeActive,
          cramDays: daysUntilExam,
        }),
      });
      if (!masteryResponse.ok) {
        console.error("Failed to update mastery");
      }

      // Don't refresh during quiz - will refresh when leaving quiz page
      // This prevents re-renders during practice
    } catch (err) {
      console.error("Error recording history:", err);
    }
  };

  // Get mastery for a specific question
  const getMasteryForQuestion = (questionId: number): QuestionMastery | null => {
    return mastery.find((m) => m.questionId === questionId) || null;
  };

  // Get practice questions based on global study mode
  const getPracticeQuestions = async (
    questionType: "all" | "mcq" | "saq",
    count: number
  ): Promise<number[]> => {
    const userId = getCurrentUserId();

    // Filter questions by type AND ensure they have community content:
    // - MCQ: at least one option has votes
    // - SAQ: at least one answer exists
    const filteredQuestions = questions.filter((q) => {
      // First filter by type
      if (questionType !== "all" && q.type !== questionType) {
        return false;
      }

      // Then filter by community content
      if (q.type === "mcq") {
        // MCQ must have at least one vote on any option
        return q.options?.some(opt => opt.votes > 0) ?? false;
      } else {
        // SAQ must have at least one answer
        return (q.answers?.length ?? 0) > 0;
      }
    });
    const questionIds = filteredQuestions.map((q) => q.id);

    // Determine mode based on global settings
    const mode: PracticeMode = isCramModeActive ? "cram" : "smart";

    try {
      const response = await fetch("/api/practice/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          mode,
          questionIds,
          count,
          cramDays: daysUntilExam ?? 7,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get practice questions");
      }

      const data = await response.json();
      return data.questionIds;
    } catch (err) {
      console.error("Error getting practice questions:", err);
      // Fallback to random
      const shuffled = [...questionIds].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }
  };

  const value: AppContextType = {
    questions,
    user,
    userVotes,
    mastery,
    masteryStats,
    initialLoading,
    isRefreshing,
    error,
    currentUserName: getCurrentUserName(),
    // Study mode
    studyMode,
    isCramModeActive,
    daysUntilExam,
    setExamDate,
    // Currency
    currencyInfo,
    refreshCurrency,
    claimDailyBonus,
    // Operations
    refreshQuestions,
    addQuestion,
    voteOnMCQ,
    voteOnSAQ,
    addSAQAnswer,
    getQuestion,
    getUserVoteForQuestion,
    refreshUser,
    addToHistory,
    refreshMastery,
    getMasteryForQuestion,
    getPracticeQuestions,
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

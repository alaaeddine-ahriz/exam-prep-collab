import { IUserService } from "../interfaces";
import {
  User,
  UserStats,
  AnswerHistory,
  CreateUserDTO,
  RecordHistoryDTO,
} from "../types";
import { getSupabaseClient } from "./client";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Calculate new streak based on last active date
 * - Same day: streak stays the same
 * - Yesterday: streak increments by 1
 * - More than 1 day ago: streak resets to 1
 */
function calculateNewStreak(lastActive: Date, currentStreak: number): number {
  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  
  // Normalize to start of day (in local timezone)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDay = new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate());
  
  // Calculate difference in days
  const diffTime = today.getTime() - lastDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Same day - streak stays the same (or starts at 1 if it was 0)
    return currentStreak || 1;
  } else if (diffDays === 1) {
    // Yesterday - increment streak
    return currentStreak + 1;
  } else {
    // Missed a day or more - reset to 1
    return 1;
  }
}

export class SupabaseUserService implements IUserService {
  async getUserById(id: string): Promise<User | null> {
    const supabase = getSupabaseClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !user) return null;

    const stats = await this.getUserStats(id);
    const history = await this.getUserHistory(id);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar_url || undefined,
      stats,
      history,
      joinedAt: new Date(user.created_at),
      examDate: user.exam_date || null,
    };
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const supabase = getSupabaseClient();

    // Get user basic info
    const { data: user } = await supabase
      .from("users")
      .select("streak, last_active")
      .eq("id", userId)
      .single();

    if (!user) {
      return {
        totalAnswered: 0,
        correctAnswers: 0,
        mcqAnswered: 0,
        mcqCorrect: 0,
        saqAnswered: 0,
        saqCorrect: 0,
        streak: 0,
        lastActive: new Date(),
      };
    }

    // Get history stats
    const { data: history } = await supabase
      .from("user_history")
      .select("question_type, is_correct")
      .eq("user_id", userId);

    const stats = {
      totalAnswered: 0,
      correctAnswers: 0,
      mcqAnswered: 0,
      mcqCorrect: 0,
      saqAnswered: 0,
      saqCorrect: 0,
    };

    (history || []).forEach((h: any) => {
      stats.totalAnswered++;
      if (h.is_correct) stats.correctAnswers++;
      
      if (h.question_type === "mcq") {
        stats.mcqAnswered++;
        if (h.is_correct) stats.mcqCorrect++;
      } else {
        stats.saqAnswered++;
        if (h.is_correct) stats.saqCorrect++;
      }
    });

    return {
      ...stats,
      streak: user.streak || 0,
      lastActive: new Date(user.last_active),
    };
  }

  async getUserHistory(userId: string, limit: number = 50): Promise<AnswerHistory[]> {
    const supabase = getSupabaseClient();

    const { data: history, error } = await supabase
      .from("user_history")
      .select(`
        *,
        questions (question)
      `)
      .eq("user_id", userId)
      .order("answered_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (history || []).map((h: any) => ({
      id: h.id,
      questionId: h.question_id,
      questionText: h.questions?.question || "",
      questionType: h.question_type,
      userAnswer: h.user_answer,
      consensusAnswer: h.consensus_answer,
      isCorrect: h.is_correct,
      answeredAt: new Date(h.answered_at),
    }));
  }

  async createUser(dto: CreateUserDTO): Promise<User> {
    const supabase = getSupabaseClient();

    const { error } = await supabase.from("users").insert({
      id: dto.id,
      name: dto.name,
      email: dto.email,
    });

    if (error) throw error;

    return (await this.getUserById(dto.id))!;
  }

  async updateStreak(userId: string, streak: number): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("users")
      .update({ streak })
      .eq("id", userId);

    if (error) throw error;
  }

  async updateLastActive(userId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("users")
      .update({ last_active: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw error;
  }

  async recordHistory(dto: RecordHistoryDTO): Promise<void> {
    const supabase = getSupabaseClient();

    const historyId = generateId();

    const { error } = await supabase.from("user_history").insert({
      id: historyId,
      user_id: dto.userId,
      question_id: dto.questionId,
      question_type: dto.questionType,
      user_answer: dto.userAnswer,
      consensus_answer: dto.consensusAnswer,
      is_correct: dto.isCorrect,
    });

    if (error) throw error;

    // Calculate and update streak before updating last_active
    const { data: user } = await supabase
      .from("users")
      .select("streak, last_active")
      .eq("id", dto.userId)
      .single();

    if (user) {
      const newStreak = calculateNewStreak(new Date(user.last_active), user.streak || 0);
      await this.updateStreak(dto.userId, newStreak);
    }

    // Update last active
    await this.updateLastActive(dto.userId);
  }

  async ensureDefaultUser(): Promise<User> {
    const defaultUserId = "local-user";

    const existingUser = await this.getUserById(defaultUserId);
    if (existingUser) return existingUser;

    return this.createUser({
      id: defaultUserId,
      name: "Guest",
      email: "guest@local",
    });
  }

  async updateExamDate(userId: string, examDate: string | null): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("users")
      .update({ exam_date: examDate })
      .eq("id", userId);

    if (error) throw error;
  }
}


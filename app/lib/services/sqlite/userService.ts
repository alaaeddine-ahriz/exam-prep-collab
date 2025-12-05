import { IUserService } from "../interfaces";
import {
  User,
  UserStats,
  AnswerHistory,
  CreateUserDTO,
  RecordHistoryDTO,
  DBUser,
  DBUserHistory,
  DBQuestion,
} from "../types";
import { getDatabase } from "./database";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export class SQLiteUserService implements IUserService {
  async getUserById(id: string): Promise<User | null> {
    const db = getDatabase();

    const user = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(id) as DBUser | undefined;

    if (!user) return null;

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
    };
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const db = getDatabase();

    const user = db
      .prepare("SELECT streak, last_active FROM users WHERE id = ?")
      .get(userId) as Pick<DBUser, "streak" | "last_active"> | undefined;

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

    // Get stats from history
    const historyStats = db
      .prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
          SUM(CASE WHEN question_type = 'mcq' THEN 1 ELSE 0 END) as mcq_total,
          SUM(CASE WHEN question_type = 'mcq' AND is_correct = 1 THEN 1 ELSE 0 END) as mcq_correct,
          SUM(CASE WHEN question_type = 'saq' THEN 1 ELSE 0 END) as saq_total,
          SUM(CASE WHEN question_type = 'saq' AND is_correct = 1 THEN 1 ELSE 0 END) as saq_correct
        FROM user_history
        WHERE user_id = ?
      `)
      .get(userId) as {
        total: number;
        correct: number;
        mcq_total: number;
        mcq_correct: number;
        saq_total: number;
        saq_correct: number;
      };

    return {
      totalAnswered: historyStats.total || 0,
      correctAnswers: historyStats.correct || 0,
      mcqAnswered: historyStats.mcq_total || 0,
      mcqCorrect: historyStats.mcq_correct || 0,
      saqAnswered: historyStats.saq_total || 0,
      saqCorrect: historyStats.saq_correct || 0,
      streak: user.streak,
      lastActive: new Date(user.last_active),
    };
  }

  async getUserHistory(userId: string, limit: number = 50): Promise<AnswerHistory[]> {
    const db = getDatabase();

    const history = db
      .prepare(`
        SELECT h.*, q.question as question_text
        FROM user_history h
        JOIN questions q ON h.question_id = q.id
        WHERE h.user_id = ?
        ORDER BY h.answered_at DESC
        LIMIT ?
      `)
      .all(userId, limit) as (DBUserHistory & { question_text: string })[];

    return history.map((h) => ({
      id: h.id,
      questionId: h.question_id,
      questionText: h.question_text,
      questionType: h.question_type,
      userAnswer: h.user_answer,
      consensusAnswer: h.consensus_answer,
      isCorrect: Boolean(h.is_correct),
      answeredAt: new Date(h.answered_at),
    }));
  }

  async createUser(dto: CreateUserDTO): Promise<User> {
    const db = getDatabase();

    db.prepare(`
      INSERT INTO users (id, name, email)
      VALUES (?, ?, ?)
    `).run(dto.id, dto.name, dto.email);

    return (await this.getUserById(dto.id))!;
  }

  async updateStreak(userId: string, streak: number): Promise<void> {
    const db = getDatabase();

    db.prepare(`
      UPDATE users SET streak = ? WHERE id = ?
    `).run(streak, userId);
  }

  async updateLastActive(userId: string): Promise<void> {
    const db = getDatabase();

    db.prepare(`
      UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?
    `).run(userId);
  }

  async recordHistory(dto: RecordHistoryDTO): Promise<void> {
    const db = getDatabase();

    const historyId = generateId();

    db.prepare(`
      INSERT INTO user_history (id, user_id, question_id, question_type, user_answer, consensus_answer, is_correct)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      historyId,
      dto.userId,
      dto.questionId,
      dto.questionType,
      dto.userAnswer,
      dto.consensusAnswer,
      dto.isCorrect ? 1 : 0
    );

    // Update last active
    await this.updateLastActive(dto.userId);
  }

  // Ensure default user exists (for backwards compatibility)
  async ensureDefaultUser(): Promise<User> {
    const db = getDatabase();
    const defaultUserId = "local-user";

    const existingUser = await this.getUserById(defaultUserId);
    if (existingUser) return existingUser;

    return this.createUser({
      id: defaultUserId,
      name: "Guest",
      email: "guest@local",
    });
  }
}


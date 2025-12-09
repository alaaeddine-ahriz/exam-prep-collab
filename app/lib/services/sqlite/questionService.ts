import { IQuestionService } from "../interfaces";
import {
  Question,
  QuestionType,
  CreateMCQQuestionDTO,
  CreateSAQQuestionDTO,
  CreateSAQAnswerDTO,
  DBQuestion,
  DBMCQOption,
  DBSAQAnswer,
} from "../types";
import { getDatabase } from "./database";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export class SQLiteQuestionService implements IQuestionService {
  private mapDBQuestionToQuestion(
    dbQuestion: DBQuestion,
    options?: DBMCQOption[],
    answers?: DBSAQAnswer[]
  ): Question {
    const question: Question = {
      id: dbQuestion.id,
      type: dbQuestion.type,
      question: dbQuestion.question,
      createdBy: dbQuestion.created_by,
      createdAt: new Date(dbQuestion.created_at),
    };

    if (dbQuestion.type === "mcq" && options) {
      question.options = options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        votes: opt.vote_count,
      }));
    }

    if (dbQuestion.type === "saq" && answers) {
      question.answers = answers.map((ans) => ({
        id: ans.id,
        text: ans.text,
        votes: ans.vote_count,
        createdBy: ans.created_by,
        createdAt: new Date(ans.created_at),
      }));
    }

    return question;
  }

  async getAllQuestions(): Promise<Question[]> {
    const db = getDatabase();

    const questions = db
      .prepare("SELECT * FROM questions ORDER BY created_at DESC")
      .all() as DBQuestion[];

    return questions.map((q) => {
      if (q.type === "mcq") {
        const options = db
          .prepare("SELECT * FROM mcq_options WHERE question_id = ?")
          .all(q.id) as DBMCQOption[];
        return this.mapDBQuestionToQuestion(q, options);
      } else {
        const answers = db
          .prepare("SELECT * FROM saq_answers WHERE question_id = ? ORDER BY vote_count DESC")
          .all(q.id) as DBSAQAnswer[];
        return this.mapDBQuestionToQuestion(q, undefined, answers);
      }
    });
  }

  async getQuestionById(id: number): Promise<Question | null> {
    const db = getDatabase();

    const question = db
      .prepare("SELECT * FROM questions WHERE id = ?")
      .get(id) as DBQuestion | undefined;

    if (!question) return null;

    if (question.type === "mcq") {
      const options = db
        .prepare("SELECT * FROM mcq_options WHERE question_id = ?")
        .all(id) as DBMCQOption[];
      return this.mapDBQuestionToQuestion(question, options);
    } else {
      const answers = db
        .prepare("SELECT * FROM saq_answers WHERE question_id = ? ORDER BY vote_count DESC")
        .all(id) as DBSAQAnswer[];
      return this.mapDBQuestionToQuestion(question, undefined, answers);
    }
  }

  async getQuestionsByType(type: QuestionType): Promise<Question[]> {
    const db = getDatabase();

    const questions = db
      .prepare("SELECT * FROM questions WHERE type = ? ORDER BY created_at DESC")
      .all(type) as DBQuestion[];

    return Promise.all(
      questions.map(async (q) => {
        const fullQuestion = await this.getQuestionById(q.id);
        return fullQuestion!;
      })
    );
  }

  async searchQuestions(query: string): Promise<Question[]> {
    const db = getDatabase();

    const questions = db
      .prepare("SELECT * FROM questions WHERE question LIKE ? ORDER BY created_at DESC")
      .all(`%${query}%`) as DBQuestion[];

    return Promise.all(
      questions.map(async (q) => {
        const fullQuestion = await this.getQuestionById(q.id);
        return fullQuestion!;
      })
    );
  }

  async createMCQQuestion(dto: CreateMCQQuestionDTO): Promise<Question> {
    const db = getDatabase();

    const insertQuestion = db.prepare(`
      INSERT INTO questions (type, question, created_by)
      VALUES ('mcq', ?, ?)
    `);

    const insertOption = db.prepare(`
      INSERT INTO mcq_options (id, question_id, text, vote_count)
      VALUES (?, ?, ?, 0)
    `);

    const transaction = db.transaction(() => {
      const result = insertQuestion.run(dto.question, dto.createdBy);
      const questionId = result.lastInsertRowid as number;

      for (const option of dto.options) {
        insertOption.run(option.id, questionId, option.text);
      }

      return questionId;
    });

    const questionId = transaction();
    return (await this.getQuestionById(questionId))!;
  }

  async createSAQQuestion(dto: CreateSAQQuestionDTO): Promise<Question> {
    const db = getDatabase();

    const result = db
      .prepare(`
        INSERT INTO questions (type, question, created_by)
        VALUES ('saq', ?, ?)
      `)
      .run(dto.question, dto.createdBy);

    const questionId = result.lastInsertRowid as number;
    return (await this.getQuestionById(questionId))!;
  }

  async addSAQAnswer(dto: CreateSAQAnswerDTO): Promise<Question> {
    const db = getDatabase();

    const answerId = generateId();

    db.prepare(`
      INSERT INTO saq_answers (id, question_id, text, vote_count, created_by)
      VALUES (?, ?, ?, 0, ?)
    `).run(answerId, dto.questionId, dto.text, dto.createdBy);

    return (await this.getQuestionById(dto.questionId))!;
  }

  async voteOnMCQOption(questionId: number, optionId: string, userId: string): Promise<void> {
    const db = getDatabase();

    const transaction = db.transaction(() => {
      // Check if user already voted
      const existingVote = db
        .prepare("SELECT * FROM votes WHERE user_id = ? AND question_id = ?")
        .get(userId, questionId);

      if (existingVote) {
        throw new Error("User has already voted on this question");
      }

      // Record the vote
      db.prepare(`
        INSERT INTO votes (user_id, question_id, option_id)
        VALUES (?, ?, ?)
      `).run(userId, questionId, optionId);

      // Increment vote count
      db.prepare(`
        UPDATE mcq_options SET vote_count = vote_count + 1
        WHERE question_id = ? AND id = ?
      `).run(questionId, optionId);
    });

    transaction();
  }

  async voteOnSAQAnswer(questionId: number, answerId: string, userId: string): Promise<void> {
    const db = getDatabase();

    const transaction = db.transaction(() => {
      // Check if user already voted
      const existingVote = db
        .prepare("SELECT * FROM votes WHERE user_id = ? AND question_id = ?")
        .get(userId, questionId);

      if (existingVote) {
        throw new Error("User has already voted on this question");
      }

      // Record the vote
      db.prepare(`
        INSERT INTO votes (user_id, question_id, answer_id)
        VALUES (?, ?, ?)
      `).run(userId, questionId, answerId);

      // Increment vote count
      db.prepare(`
        UPDATE saq_answers SET vote_count = vote_count + 1
        WHERE id = ?
      `).run(answerId);
    });

    transaction();
  }

  async hasUserVoted(userId: string, questionId: number): Promise<boolean> {
    const db = getDatabase();

    const vote = db
      .prepare("SELECT * FROM votes WHERE user_id = ? AND question_id = ?")
      .get(userId, questionId);

    return !!vote;
  }

  async getUserVote(userId: string, questionId: number): Promise<{ optionId?: string; answerId?: string } | null> {
    const db = getDatabase();

    const vote = db
      .prepare("SELECT option_id, answer_id FROM votes WHERE user_id = ? AND question_id = ?")
      .get(userId, questionId) as { option_id: string | null; answer_id: string | null } | undefined;

    if (!vote) return null;

    return {
      optionId: vote.option_id || undefined,
      answerId: vote.answer_id || undefined,
    };
  }

  async getAllUserVotes(userId: string): Promise<Record<number, { optionId?: string; answerId?: string }>> {
    const db = getDatabase();

    const votes = db
      .prepare("SELECT question_id, option_id, answer_id FROM votes WHERE user_id = ?")
      .all(userId) as { question_id: number; option_id: string | null; answer_id: string | null }[];

    const result: Record<number, { optionId?: string; answerId?: string }> = {};
    for (const vote of votes) {
      result[vote.question_id] = {
        optionId: vote.option_id || undefined,
        answerId: vote.answer_id || undefined,
      };
    }
    return result;
  }

  async changeVote(
    userId: string,
    questionId: number,
    newOptionId?: string,
    newAnswerId?: string
  ): Promise<void> {
    const db = getDatabase();

    const transaction = db.transaction(() => {
      // Get current vote
      const existingVote = db
        .prepare("SELECT option_id, answer_id FROM votes WHERE user_id = ? AND question_id = ?")
        .get(userId, questionId) as { option_id: string | null; answer_id: string | null } | undefined;

      if (!existingVote) {
        // No existing vote, create new one
        if (newOptionId) {
          db.prepare(`
            INSERT INTO votes (user_id, question_id, option_id)
            VALUES (?, ?, ?)
          `).run(userId, questionId, newOptionId);

          db.prepare(`
            UPDATE mcq_options SET vote_count = vote_count + 1
            WHERE question_id = ? AND id = ?
          `).run(questionId, newOptionId);
        } else if (newAnswerId) {
          db.prepare(`
            INSERT INTO votes (user_id, question_id, answer_id)
            VALUES (?, ?, ?)
          `).run(userId, questionId, newAnswerId);

          db.prepare(`
            UPDATE saq_answers SET vote_count = vote_count + 1
            WHERE id = ?
          `).run(newAnswerId);
        }
        return;
      }

      // Decrement old vote count
      if (existingVote.option_id) {
        db.prepare(`
          UPDATE mcq_options SET vote_count = vote_count - 1
          WHERE question_id = ? AND id = ?
        `).run(questionId, existingVote.option_id);
      } else if (existingVote.answer_id) {
        db.prepare(`
          UPDATE saq_answers SET vote_count = vote_count - 1
          WHERE id = ?
        `).run(existingVote.answer_id);
      }

      // Update vote record and increment new vote count
      if (newOptionId) {
        db.prepare(`
          UPDATE votes SET option_id = ?, answer_id = NULL
          WHERE user_id = ? AND question_id = ?
        `).run(newOptionId, userId, questionId);

        db.prepare(`
          UPDATE mcq_options SET vote_count = vote_count + 1
          WHERE question_id = ? AND id = ?
        `).run(questionId, newOptionId);
      } else if (newAnswerId) {
        db.prepare(`
          UPDATE votes SET answer_id = ?, option_id = NULL
          WHERE user_id = ? AND question_id = ?
        `).run(newAnswerId, userId, questionId);

        db.prepare(`
          UPDATE saq_answers SET vote_count = vote_count + 1
          WHERE id = ?
        `).run(newAnswerId);
      }
    });

    transaction();
  }
}


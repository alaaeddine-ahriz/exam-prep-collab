import { IQuestionService } from "../interfaces";
import {
  Question,
  QuestionType,
  CreateMCQQuestionDTO,
  CreateSAQQuestionDTO,
  CreateSAQAnswerDTO,
} from "../types";
import { getSupabaseClient } from "./client";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export class SupabaseQuestionService implements IQuestionService {
  private async mapToQuestion(dbQuestion: any): Promise<Question> {
    const supabase = getSupabaseClient();
    
    const question: Question = {
      id: dbQuestion.id,
      type: dbQuestion.type,
      question: dbQuestion.question,
      createdBy: dbQuestion.created_by,
      createdAt: new Date(dbQuestion.created_at),
    };

    if (dbQuestion.type === "mcq") {
      const { data: options } = await supabase
        .from("mcq_options")
        .select("*")
        .eq("question_id", dbQuestion.id);

      question.options = (options || []).map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        votes: opt.vote_count,
      }));
    } else {
      const { data: answers } = await supabase
        .from("saq_answers")
        .select("*")
        .eq("question_id", dbQuestion.id)
        .order("vote_count", { ascending: false });

      question.answers = (answers || []).map((ans: any) => ({
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
    const supabase = getSupabaseClient();

    const { data: questions, error } = await supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Promise.all((questions || []).map((q) => this.mapToQuestion(q)));
  }

  async getQuestionById(id: number): Promise<Question | null> {
    const supabase = getSupabaseClient();

    const { data: question, error } = await supabase
      .from("questions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !question) return null;

    return this.mapToQuestion(question);
  }

  async getQuestionsByType(type: QuestionType): Promise<Question[]> {
    const supabase = getSupabaseClient();

    const { data: questions, error } = await supabase
      .from("questions")
      .select("*")
      .eq("type", type)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Promise.all((questions || []).map((q) => this.mapToQuestion(q)));
  }

  async searchQuestions(query: string): Promise<Question[]> {
    const supabase = getSupabaseClient();

    const { data: questions, error } = await supabase
      .from("questions")
      .select("*")
      .ilike("question", `%${query}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Promise.all((questions || []).map((q) => this.mapToQuestion(q)));
  }

  async createMCQQuestion(dto: CreateMCQQuestionDTO): Promise<Question> {
    const supabase = getSupabaseClient();

    // Insert question
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .insert({
        type: "mcq",
        question: dto.question,
        created_by: dto.createdBy,
      })
      .select()
      .single();

    if (questionError) throw questionError;

    // Insert options
    const options = dto.options.map((opt) => ({
      id: opt.id,
      question_id: question.id,
      text: opt.text,
      vote_count: 0,
    }));

    const { error: optionsError } = await supabase
      .from("mcq_options")
      .insert(options);

    if (optionsError) throw optionsError;

    return (await this.getQuestionById(question.id))!;
  }

  async createSAQQuestion(dto: CreateSAQQuestionDTO): Promise<Question> {
    const supabase = getSupabaseClient();

    const { data: question, error } = await supabase
      .from("questions")
      .insert({
        type: "saq",
        question: dto.question,
        created_by: dto.createdBy,
      })
      .select()
      .single();

    if (error) throw error;

    return (await this.getQuestionById(question.id))!;
  }

  async addSAQAnswer(dto: CreateSAQAnswerDTO): Promise<Question> {
    const supabase = getSupabaseClient();

    const answerId = generateId();

    const { error } = await supabase.from("saq_answers").insert({
      id: answerId,
      question_id: dto.questionId,
      text: dto.text,
      vote_count: 1,
      created_by: dto.createdBy,
    });

    if (error) throw error;

    return (await this.getQuestionById(dto.questionId))!;
  }

  async voteOnMCQOption(questionId: number, optionId: string, userId: string): Promise<void> {
    const supabase = getSupabaseClient();

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("votes")
      .select("*")
      .eq("user_id", userId)
      .eq("question_id", questionId)
      .single();

    if (existingVote) {
      throw new Error("User has already voted on this question");
    }

    // Record vote
    const { error: voteError } = await supabase.from("votes").insert({
      user_id: userId,
      question_id: questionId,
      option_id: optionId,
    });

    if (voteError) throw voteError;

    // Increment vote count using RPC or direct update
    const { error: updateError } = await supabase.rpc("increment_mcq_vote", {
      p_question_id: questionId,
      p_option_id: optionId,
    });

    // Fallback to direct update if RPC doesn't exist
    if (updateError) {
      const { data: option } = await supabase
        .from("mcq_options")
        .select("vote_count")
        .eq("question_id", questionId)
        .eq("id", optionId)
        .single();

      if (option) {
        await supabase
          .from("mcq_options")
          .update({ vote_count: option.vote_count + 1 })
          .eq("question_id", questionId)
          .eq("id", optionId);
      }
    }
  }

  async voteOnSAQAnswer(questionId: number, answerId: string, userId: string): Promise<void> {
    const supabase = getSupabaseClient();

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("votes")
      .select("*")
      .eq("user_id", userId)
      .eq("question_id", questionId)
      .single();

    if (existingVote) {
      throw new Error("User has already voted on this question");
    }

    // Record vote
    const { error: voteError } = await supabase.from("votes").insert({
      user_id: userId,
      question_id: questionId,
      answer_id: answerId,
    });

    if (voteError) throw voteError;

    // Increment vote count
    const { data: answer } = await supabase
      .from("saq_answers")
      .select("vote_count")
      .eq("id", answerId)
      .single();

    if (answer) {
      await supabase
        .from("saq_answers")
        .update({ vote_count: answer.vote_count + 1 })
        .eq("id", answerId);
    }
  }

  async hasUserVoted(userId: string, questionId: number): Promise<boolean> {
    const supabase = getSupabaseClient();

    const { data } = await supabase
      .from("votes")
      .select("id")
      .eq("user_id", userId)
      .eq("question_id", questionId)
      .single();

    return !!data;
  }

  async getUserVote(userId: string, questionId: number): Promise<{ optionId?: string; answerId?: string } | null> {
    const supabase = getSupabaseClient();

    const { data } = await supabase
      .from("votes")
      .select("option_id, answer_id")
      .eq("user_id", userId)
      .eq("question_id", questionId)
      .single();

    if (!data) return null;

    return {
      optionId: data.option_id || undefined,
      answerId: data.answer_id || undefined,
    };
  }

  async changeVote(
    userId: string,
    questionId: number,
    newOptionId?: string,
    newAnswerId?: string
  ): Promise<void> {
    const supabase = getSupabaseClient();

    // Get existing vote
    const { data: existingVote } = await supabase
      .from("votes")
      .select("option_id, answer_id")
      .eq("user_id", userId)
      .eq("question_id", questionId)
      .single();

    if (!existingVote) {
      // No existing vote, create new one
      if (newOptionId) {
        await this.voteOnMCQOption(questionId, newOptionId, userId);
      } else if (newAnswerId) {
        await this.voteOnSAQAnswer(questionId, newAnswerId, userId);
      }
      return;
    }

    // Decrement old vote count
    if (existingVote.option_id) {
      const { data: oldOption } = await supabase
        .from("mcq_options")
        .select("vote_count")
        .eq("question_id", questionId)
        .eq("id", existingVote.option_id)
        .single();

      if (oldOption) {
        await supabase
          .from("mcq_options")
          .update({ vote_count: Math.max(0, oldOption.vote_count - 1) })
          .eq("question_id", questionId)
          .eq("id", existingVote.option_id);
      }
    } else if (existingVote.answer_id) {
      const { data: oldAnswer } = await supabase
        .from("saq_answers")
        .select("vote_count")
        .eq("id", existingVote.answer_id)
        .single();

      if (oldAnswer) {
        await supabase
          .from("saq_answers")
          .update({ vote_count: Math.max(0, oldAnswer.vote_count - 1) })
          .eq("id", existingVote.answer_id);
      }
    }

    // Update vote record
    if (newOptionId) {
      await supabase
        .from("votes")
        .update({ option_id: newOptionId, answer_id: null })
        .eq("user_id", userId)
        .eq("question_id", questionId);

      // Increment new vote count
      const { data: newOption } = await supabase
        .from("mcq_options")
        .select("vote_count")
        .eq("question_id", questionId)
        .eq("id", newOptionId)
        .single();

      if (newOption) {
        await supabase
          .from("mcq_options")
          .update({ vote_count: newOption.vote_count + 1 })
          .eq("question_id", questionId)
          .eq("id", newOptionId);
      }
    } else if (newAnswerId) {
      await supabase
        .from("votes")
        .update({ answer_id: newAnswerId, option_id: null })
        .eq("user_id", userId)
        .eq("question_id", questionId);

      // Increment new vote count
      const { data: newAnswer } = await supabase
        .from("saq_answers")
        .select("vote_count")
        .eq("id", newAnswerId)
        .single();

      if (newAnswer) {
        await supabase
          .from("saq_answers")
          .update({ vote_count: newAnswer.vote_count + 1 })
          .eq("id", newAnswerId);
      }
    }
  }
}


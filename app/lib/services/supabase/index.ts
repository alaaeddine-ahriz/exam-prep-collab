import { IDataService } from "../interfaces";
import { SupabaseQuestionService } from "./questionService";
import { SupabaseUserService } from "./userService";
import { closeSupabaseClient } from "./client";

export class SupabaseDataService implements IDataService {
  public questions: SupabaseQuestionService;
  public users: SupabaseUserService;

  constructor() {
    this.questions = new SupabaseQuestionService();
    this.users = new SupabaseUserService();
  }

  async initialize(): Promise<void> {
    // Supabase client initializes lazily, nothing to do here
    console.log("📦 Supabase data service initialized");
  }

  async close(): Promise<void> {
    closeSupabaseClient();
  }
}

export { SupabaseQuestionService } from "./questionService";
export { SupabaseUserService } from "./userService";
export { getSupabaseClient, closeSupabaseClient } from "./client";


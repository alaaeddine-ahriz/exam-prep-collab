import { IDataService } from "../interfaces";
import { SupabaseQuestionService } from "./questionService";
import { SupabaseUserService } from "./userService";
import { SupabaseMasteryService } from "./masteryService";
import { closeSupabaseClient } from "./client";

export class SupabaseDataService implements IDataService {
  public questions: SupabaseQuestionService;
  public users: SupabaseUserService;
  public mastery: SupabaseMasteryService;

  constructor() {
    this.questions = new SupabaseQuestionService();
    this.users = new SupabaseUserService();
    this.mastery = new SupabaseMasteryService();
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
export { SupabaseMasteryService, masteryService } from "./masteryService";
export { getSupabaseClient, closeSupabaseClient } from "./client";


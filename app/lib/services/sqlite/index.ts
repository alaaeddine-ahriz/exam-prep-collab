import { IDataService } from "../interfaces";
import { SQLiteQuestionService } from "./questionService";
import { SQLiteUserService } from "./userService";
import { initializeDatabase, closeDatabase } from "./database";

export class SQLiteDataService implements IDataService {
  public questions: SQLiteQuestionService;
  public users: SQLiteUserService;

  constructor() {
    this.questions = new SQLiteQuestionService();
    this.users = new SQLiteUserService();
  }

  async initialize(): Promise<void> {
    initializeDatabase();
  }

  async close(): Promise<void> {
    closeDatabase();
  }
}

export { SQLiteQuestionService } from "./questionService";
export { SQLiteUserService } from "./userService";
export { SQLiteMasteryService, sqliteMasteryService } from "./masteryService";
export { initializeDatabase, closeDatabase, getDatabase } from "./database";


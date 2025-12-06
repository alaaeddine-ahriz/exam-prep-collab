import currencyConfigJson from "./currency.json";

export interface CurrencyConfig {
  currency: {
    name: string;
    icon: string;
    initialBalance: number;
  };
  rewards: {
    castVote: number;
    submitAnswer: number;
    dailyLogin: number;
  };
  costs: {
    practiceSession: number;
    aiVerification: number;
  };
  limits: {
    freePracticeSessionsPerDay: number;
  };
}

export const currencyConfig: CurrencyConfig = currencyConfigJson;

export type TransactionType = 
  | "vote" 
  | "answer" 
  | "daily_login" 
  | "practice" 
  | "ai_verify"
  | "initial_balance";


/**
 * AI Service Interface
 */

import {
  GrammarFixRequest,
  GrammarFixResponse,
  AnswerVerificationRequest,
  AnswerVerificationResponse,
} from "./types";

export interface IAIService {
  /**
   * Fix grammar and spelling in the provided text
   */
  fixGrammarAndSpelling(request: GrammarFixRequest): Promise<GrammarFixResponse>;

  /**
   * Verify if a user's answer matches the correct answers using AI
   */
  verifyAnswer(request: AnswerVerificationRequest): Promise<AnswerVerificationResponse>;
}

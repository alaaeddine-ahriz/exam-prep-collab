/**
 * AI Service Interface
 */

import {
  GrammarFixRequest,
  GrammarFixResponse,
  AnswerVerificationRequest,
  AnswerVerificationResponse,
  ExplanationRequest,
  ExplanationResponse,
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

  /**
   * Generate a simple explanation of why an answer is correct
   */
  generateExplanation(request: ExplanationRequest): Promise<ExplanationResponse>;
}


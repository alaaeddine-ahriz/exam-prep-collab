/**
 * AI Service Module
 */

export * from "./types";
export * from "./interface";
export { OpenAIService } from "./openaiService";

import { IAIService } from "./interface";
import { OpenAIService } from "./openaiService";

let aiService: IAIService | null = null;

/**
 * Get the AI service instance.
 * Returns null if OpenAI API key is not configured.
 */
export function getAIService(): IAIService | null {
  if (aiService) {
    return aiService;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ OPENAI_API_KEY not configured. AI features will be disabled.");
    return null;
  }

  aiService = new OpenAIService(apiKey);
  console.log("🤖 AI service initialized");

  return aiService;
}

/**
 * Check if AI features are available
 */
export function isAIEnabled(): boolean {
  return !!process.env.OPENAI_API_KEY;
}


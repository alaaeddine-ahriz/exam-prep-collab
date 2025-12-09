/**
 * OpenAI-based AI Service Implementation
 */

import { IAIService } from "./interface";
import {
  GrammarFixRequest,
  GrammarFixResponse,
  AnswerVerificationRequest,
  AnswerVerificationResponse,
  ExplanationRequest,
  ExplanationResponse,
} from "./types";

export class OpenAIService implements IAIService {
  private apiKey: string;
  private baseUrl: string = "https://api.openai.com/v1";
  private model: string = "gpt-4o-mini"; // Cost-effective for these tasks

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async callOpenAI(
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    jsonMode: boolean = false
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 500,
        ...(jsonMode && { response_format: { type: "json_object" } }),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async fixGrammarAndSpelling(
    request: GrammarFixRequest
  ): Promise<GrammarFixResponse> {
    const { text } = request;

    // Skip if text is too short or empty
    if (!text || text.trim().length < 3) {
      return {
        originalText: text,
        fixedText: text,
        wasModified: false,
      };
    }

    const systemPrompt = `You are a helpful assistant that fixes grammar and spelling errors in academic answers.
Your task is to:
1. Fix any spelling mistakes
2. Fix grammatical errors
3. Keep the original meaning intact
4. Maintain the same tone and style
5. Do NOT add new information or change the meaning
6. Do NOT add unnecessary words or make the text longer
7. If the text is already correct, return it unchanged

Respond with ONLY a JSON object with this exact format:
{
  "fixedText": "the corrected text here",
  "wasModified": true or false
}`;

    const userPrompt = `Please fix any grammar and spelling errors in this answer:\n\n"${text}"`;

    try {
      const response = await this.callOpenAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        true
      );

      const result = JSON.parse(response);

      return {
        originalText: text,
        fixedText: result.fixedText || text,
        wasModified: result.wasModified || false,
      };
    } catch (error) {
      console.error("Error fixing grammar:", error);
      // Return original text if AI fails
      return {
        originalText: text,
        fixedText: text,
        wasModified: false,
      };
    }
  }

  async verifyAnswer(
    request: AnswerVerificationRequest
  ): Promise<AnswerVerificationResponse> {
    const { userAnswer, correctAnswers, questionText } = request;

    // If no correct answers provided, can't verify
    if (!correctAnswers || correctAnswers.length === 0) {
      return {
        isCorrect: false,
        confidence: 0,
        explanation: "No reference answers available for comparison.",
      };
    }

    const systemPrompt = `You are an academic answer evaluator. Your task is to determine if a student's answer is semantically correct when compared to reference answers.

Consider an answer CORRECT if:
1. It captures the main concept or key points of the reference answers
2. The meaning is essentially the same, even if worded differently
3. It's a valid paraphrase or uses synonyms
4. It includes the core information needed to answer the question

Consider an answer INCORRECT if:
1. It misses the key concept or main point
2. It contains factually wrong information
3. It's completely off-topic
4. It's too vague or incomplete to be considered a proper answer

Be lenient with minor variations in wording or style, but strict about accuracy of content.

Respond with ONLY a JSON object with this exact format:
{
  "isCorrect": true or false,
  "confidence": 0.0 to 1.0,
  "explanation": "Brief explanation of why the answer is correct or incorrect",
  "matchedAnswer": "the reference answer it most closely matches, or null if none"
}`;

    const userPrompt = `Question: ${questionText}

Student's Answer: "${userAnswer}"

Reference Answers (top voted by the community):
${correctAnswers.map((a, i) => `${i + 1}. "${a}"`).join("\n")}

Evaluate if the student's answer is semantically correct.`;

    try {
      const response = await this.callOpenAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        true
      );

      const result = JSON.parse(response);

      return {
        isCorrect: result.isCorrect || false,
        confidence: result.confidence || 0,
        explanation: result.explanation || "Unable to evaluate answer.",
        matchedAnswer: result.matchedAnswer || undefined,
      };
    } catch (error) {
      console.error("Error verifying answer:", error);
      // Fall back to simple word matching if AI fails
      return this.fallbackVerification(userAnswer, correctAnswers);
    }
  }

  /**
   * Simple fallback verification using word overlap
   */
  private fallbackVerification(
    userAnswer: string,
    correctAnswers: string[]
  ): AnswerVerificationResponse {
    const userWords = new Set(
      userAnswer
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );

    let bestMatch = "";
    let bestScore = 0;

    for (const answer of correctAnswers) {
      const answerWords = answer
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);
      const matchCount = answerWords.filter((w) => userWords.has(w)).length;
      const score = matchCount / Math.max(answerWords.length, 1);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = answer;
      }
    }

    const isCorrect = bestScore >= 0.3; // 30% word overlap threshold

    return {
      isCorrect,
      confidence: bestScore,
      explanation: isCorrect
        ? "Answer has significant overlap with community consensus."
        : "Answer differs significantly from community consensus.",
      matchedAnswer: isCorrect ? bestMatch : undefined,
    };
  }

  async generateExplanation(
    request: ExplanationRequest
  ): Promise<ExplanationResponse> {
    const { questionText, correctAnswer } = request;

    const systemPrompt = `You are a helpful tutor that explains why answers are correct in a simple, clear way.
Your task is to:
1. Provide a short, clear explanation of why the answer is correct
2. Use simple reasoning and avoid jargon
3. Focus only on the key idea - no unnecessary theory
4. Keep the explanation concise (2-4 sentences max)
5. Be direct and easy to understand

Respond with ONLY a JSON object with this exact format:
{
  "explanation": "your clear explanation here"
}`;

    const userPrompt = `Provide a short, clear explanation of why the following answer is correct. Use simple reasoning, avoid jargon, and focus only on the key idea.

Question: ${questionText}
Correct answer: ${correctAnswer}`;

    try {
      const response = await this.callOpenAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        true
      );

      const result = JSON.parse(response);

      return {
        explanation: result.explanation || "Unable to generate explanation.",
      };
    } catch (error) {
      console.error("Error generating explanation:", error);
      return {
        explanation: "Unable to generate explanation at this time.",
      };
    }
  }
}


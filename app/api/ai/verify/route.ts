import { NextRequest, NextResponse } from "next/server";
import { getAIService } from "@/app/lib/services/ai";
import { spendAIVerificationTokens, getCurrencyConfig } from "@/app/lib/services/currencyService";

export async function POST(request: NextRequest) {
  try {
    const aiService = getAIService();

    if (!aiService) {
      return NextResponse.json(
        {
          error: "AI service not available",
          isCorrect: false,
          confidence: 0,
          explanation: "AI verification is not available.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { userAnswer, correctAnswers, questionText, userId } = body;

    if (!userAnswer || typeof userAnswer !== "string") {
      return NextResponse.json(
        { error: "userAnswer is required" },
        { status: 400 }
      );
    }

    if (!correctAnswers || !Array.isArray(correctAnswers)) {
      return NextResponse.json(
        { error: "correctAnswers array is required" },
        { status: 400 }
      );
    }

    if (!questionText || typeof questionText !== "string") {
      return NextResponse.json(
        { error: "questionText is required" },
        { status: 400 }
      );
    }

    // Deduct tokens for AI verification if userId is provided
    let newBalance: number | undefined;
    if (userId) {
      const config = getCurrencyConfig();
      const spendResult = await spendAIVerificationTokens(userId);
      
      if (!spendResult.success) {
        return NextResponse.json(
          {
            error: "Insufficient balance",
            required: config.costs.aiVerification,
            balance: spendResult.balance.balance,
            currencyName: config.currency.name,
          },
          { status: 402 } // Payment Required
        );
      }
      newBalance = spendResult.balance.balance;
    }

    const result = await aiService.verifyAnswer({
      userAnswer,
      correctAnswers,
      questionText,
    });

    return NextResponse.json({
      ...result,
      newBalance,
    });
  } catch (error) {
    console.error("Answer verification API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAIService } from "@/app/lib/services/ai";
import { spendAIExplanationTokens, getCurrencyConfig } from "@/app/lib/services/currencyService";

export async function POST(request: NextRequest) {
  try {
    const aiService = getAIService();

    if (!aiService) {
      return NextResponse.json(
        {
          error: "AI service not available",
          explanation: "AI explanation is not available.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { questionText, correctAnswer, userId } = body;

    if (!questionText || typeof questionText !== "string") {
      return NextResponse.json(
        { error: "questionText is required" },
        { status: 400 }
      );
    }

    if (!correctAnswer || typeof correctAnswer !== "string") {
      return NextResponse.json(
        { error: "correctAnswer is required" },
        { status: 400 }
      );
    }

    // Deduct tokens for AI explanation if userId is provided
    let newBalance: number | undefined;
    if (userId) {
      const config = getCurrencyConfig();
      const spendResult = await spendAIExplanationTokens(userId);
      
      if (!spendResult.success) {
        return NextResponse.json(
          {
            error: "Insufficient balance",
            required: config.costs.aiExplanation,
            balance: spendResult.balance.balance,
            currencyName: config.currency.name,
          },
          { status: 402 } // Payment Required
        );
      }
      newBalance = spendResult.balance.balance;
    }

    const result = await aiService.generateExplanation({
      questionText,
      correctAnswer,
    });

    return NextResponse.json({
      ...result,
      newBalance,
    });
  } catch (error) {
    console.error("Explanation API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

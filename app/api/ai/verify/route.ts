import { NextRequest, NextResponse } from "next/server";
import { getAIService } from "@/app/lib/services/ai";

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
    const { userAnswer, correctAnswers, questionText } = body;

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

    const result = await aiService.verifyAnswer({
      userAnswer,
      correctAnswers,
      questionText,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Answer verification API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

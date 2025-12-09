import { NextRequest, NextResponse } from "next/server";
import { getAIService } from "@/app/lib/services/ai";

export async function POST(request: NextRequest) {
  try {
    const aiService = getAIService();

    if (!aiService) {
      return NextResponse.json(
        {
          error: "AI service not available",
          originalText: "",
          fixedText: "",
          wasModified: false,
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const result = await aiService.fixGrammarAndSpelling({ text });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Grammar fix API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}


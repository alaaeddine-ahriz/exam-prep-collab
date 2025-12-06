import { NextRequest, NextResponse } from "next/server";
import { masteryService } from "../../../lib/services/supabase/masteryService";
import { PracticeMode } from "../../../lib/services/types";

/**
 * POST /api/practice/questions
 * Get questions for a practice session based on mode
 * 
 * Body:
 * - userId: string
 * - mode: "random" | "smart" | "cram"
 * - questionIds: number[] - All available question IDs to choose from
 * - count: number - Number of questions to return
 * - cramDays: number (optional) - Days until exam (1-7) for cram mode
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, mode, questionIds, count, cramDays = 7 } = body as {
      userId: string;
      mode: PracticeMode;
      questionIds: number[];
      count: number;
      cramDays?: number;
    };

    if (!userId || !mode || !Array.isArray(questionIds) || !count) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    let selectedIds: number[];

    switch (mode) {
      case "smart":
        selectedIds = await masteryService.getSmartQuestions(
          userId,
          questionIds,
          count
        );
        break;
      
      case "cram":
        selectedIds = await masteryService.getCramQuestions(
          userId,
          questionIds,
          cramDays,
          count
        );
        break;
      
      case "random":
      default:
        // Shuffle and take first N
        const shuffled = [...questionIds].sort(() => Math.random() - 0.5);
        selectedIds = shuffled.slice(0, count);
        break;
    }

    return NextResponse.json({ questionIds: selectedIds });
  } catch (error) {
    console.error("Error selecting practice questions:", error);
    return NextResponse.json(
      { error: "Failed to select practice questions" },
      { status: 500 }
    );
  }
}

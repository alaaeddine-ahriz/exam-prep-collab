import { NextRequest, NextResponse } from "next/server";
import { masteryService } from "../../../../lib/services/supabase/masteryService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id]/mastery
 * Get mastery data for a user
 * 
 * Query params:
 * - questionId: (optional) Get mastery for specific question
 * - stats: (optional) If "true", return aggregate stats instead of individual records
 * - totalQuestions: (required with stats) Total question count for calculating stats
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");
    const wantStats = searchParams.get("stats") === "true";
    const totalQuestions = parseInt(searchParams.get("totalQuestions") || "0", 10);

    if (questionId) {
      // Get mastery for specific question
      const mastery = await masteryService.getMasteryForQuestion(
        userId,
        parseInt(questionId, 10)
      );
      return NextResponse.json(mastery);
    }

    if (wantStats) {
      // Get aggregate mastery stats
      const stats = await masteryService.getOverallMastery(userId, totalQuestions);
      return NextResponse.json(stats);
    }

    // Get all mastery records
    const mastery = await masteryService.getMasteryForUser(userId);
    return NextResponse.json(mastery);
  } catch (error) {
    console.error("Error fetching mastery:", error);
    return NextResponse.json(
      { error: "Failed to fetch mastery data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/[id]/mastery
 * Update mastery after answering a question
 * 
 * Body:
 * - questionId: number
 * - isCorrect: boolean
 * - isCramMode: boolean (optional)
 * - cramDays: number (optional) - days until exam for cram mode
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { questionId, isCorrect, isCramMode = false, cramDays = 7 } = body;

    if (typeof questionId !== "number" || typeof isCorrect !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const updatedMastery = await masteryService.updateMastery({
      userId,
      questionId,
      isCorrect,
      isCramMode,
      cramDays,
    });

    return NextResponse.json(updatedMastery);
  } catch (error) {
    console.error("Error updating mastery:", error);
    return NextResponse.json(
      { error: "Failed to update mastery" },
      { status: 500 }
    );
  }
}

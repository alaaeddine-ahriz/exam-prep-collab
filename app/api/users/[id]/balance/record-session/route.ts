import { NextRequest, NextResponse } from "next/server";
import { recordPracticeSession, getPracticeSessionInfo } from "@/app/lib/services/currencyService";

/**
 * POST /api/users/[id]/balance/record-session
 * Record a practice session (increments the daily session count)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const sessionInfo = await recordPracticeSession(id);

    return NextResponse.json({
      success: true,
      usedToday: sessionInfo.usedToday,
      freeRemaining: sessionInfo.freeRemaining,
      requiresPayment: sessionInfo.requiresPayment,
    });
  } catch (error) {
    console.error("Error recording practice session:", error);
    return NextResponse.json(
      { error: "Failed to record practice session" },
      { status: 500 }
    );
  }
}

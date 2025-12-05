import { NextRequest, NextResponse } from "next/server";
import { getDataService } from "@/app/lib/services";

// GET - Get all user votes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await getDataService();

    // Get all questions and check user's vote on each
    const questions = await service.questions.getAllQuestions();
    const votes: Record<number, { optionId?: string; answerId?: string }> = {};

    for (const question of questions) {
      const vote = await service.questions.getUserVote(id, question.id);
      if (vote) {
        votes[question.id] = vote;
      }
    }

    return NextResponse.json(votes);
  } catch (error) {
    console.error("Error fetching user votes:", error);
    return NextResponse.json({ error: "Failed to fetch votes" }, { status: 500 });
  }
}


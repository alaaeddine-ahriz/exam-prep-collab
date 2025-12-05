import { NextRequest, NextResponse } from "next/server";
import { getDataService } from "@/app/lib/services";

// GET - Get user's vote on this question
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await getDataService();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const questionId = parseInt(id);
    const vote = await service.questions.getUserVote(userId, questionId);

    return NextResponse.json(vote || { optionId: null, answerId: null });
  } catch (error) {
    console.error("Error getting vote:", error);
    return NextResponse.json({ error: "Failed to get vote" }, { status: 500 });
  }
}

// POST - Vote or change vote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await getDataService();
    const body = await request.json();

    const questionId = parseInt(id);
    const { type, optionId, answerId, userId } = body;

    // Use changeVote which handles both new votes and vote changes
    if (type === "mcq") {
      await service.questions.changeVote(userId, questionId, optionId, undefined);
    } else {
      await service.questions.changeVote(userId, questionId, undefined, answerId);
    }

    // Return updated question
    const question = await service.questions.getQuestionById(questionId);
    return NextResponse.json(question);
  } catch (error) {
    console.error("Error voting:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}

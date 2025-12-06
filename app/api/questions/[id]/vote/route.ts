import { NextRequest, NextResponse } from "next/server";
import { getDataService } from "@/app/lib/services";
import { awardVoteTokens } from "@/app/lib/services/currencyService";

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

    // Check if user has already voted (only award tokens for new votes)
    const hasVoted = await service.questions.hasUserVoted(userId, questionId);

    // Use changeVote which handles both new votes and vote changes
    if (type === "mcq") {
      await service.questions.changeVote(userId, questionId, optionId, undefined);
    } else {
      await service.questions.changeVote(userId, questionId, undefined, answerId);
    }

    // Award tokens only for new votes (not vote changes)
    let tokensAwarded = 0;
    if (!hasVoted) {
      try {
        const balance = await awardVoteTokens(userId);
        tokensAwarded = balance.balance;
      } catch (tokenError) {
        // Log but don't fail the vote if token award fails
        console.error("Failed to award vote tokens:", tokenError);
      }
    }

    // Return updated question
    const question = await service.questions.getQuestionById(questionId);
    return NextResponse.json({
      ...question,
      tokensAwarded: !hasVoted ? tokensAwarded : undefined,
    });
  } catch (error) {
    console.error("Error voting:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}

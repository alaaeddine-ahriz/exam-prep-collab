import { NextRequest, NextResponse } from "next/server";
import { getDataService } from "@/app/lib/services";
import { awardAnswerTokens } from "@/app/lib/services/currencyService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await getDataService();
    const body = await request.json();

    const questionId = parseInt(id);
    const { text, createdBy, userId } = body;

    const question = await service.questions.addSAQAnswer({
      questionId,
      text,
      createdBy,
    });

    // Award tokens for submitting an answer (use userId for currency, createdBy is just display name)
    let tokensAwarded: number | undefined;
    if (userId) {
      try {
        const balance = await awardAnswerTokens(userId);
        tokensAwarded = balance.balance;
      } catch (tokenError) {
        // Log but don't fail the answer submission if token award fails
        console.error("Failed to award answer tokens:", tokenError);
      }
    }

    return NextResponse.json(
      { ...question, tokensAwarded },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding answer:", error);
    return NextResponse.json({ error: "Failed to add answer" }, { status: 500 });
  }
}


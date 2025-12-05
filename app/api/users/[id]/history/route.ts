import { NextRequest, NextResponse } from "next/server";
import { getDataService } from "@/app/lib/services";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await getDataService();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");

    const history = await service.users.getUserHistory(id, limit);
    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await getDataService();
    const body = await request.json();

    await service.users.recordHistory({
      userId: id,
      questionId: body.questionId,
      questionType: body.questionType,
      userAnswer: body.userAnswer,
      consensusAnswer: body.consensusAnswer,
      isCorrect: body.isCorrect,
    });

    // Return updated user
    const user = await service.users.getUserById(id);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error recording history:", error);
    return NextResponse.json({ error: "Failed to record history" }, { status: 500 });
  }
}


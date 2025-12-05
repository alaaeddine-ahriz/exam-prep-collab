import { NextRequest, NextResponse } from "next/server";
import { getDataService } from "@/app/lib/services";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await getDataService();
    const body = await request.json();

    const questionId = parseInt(id);
    const { text, createdBy } = body;

    const question = await service.questions.addSAQAnswer({
      questionId,
      text,
      createdBy,
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Error adding answer:", error);
    return NextResponse.json({ error: "Failed to add answer" }, { status: 500 });
  }
}


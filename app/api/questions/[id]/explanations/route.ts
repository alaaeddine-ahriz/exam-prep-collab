import { NextRequest, NextResponse } from "next/server";
import { getExplanations, createExplanation } from "@/app/lib/services/explanationService";

/**
 * GET /api/questions/[id]/explanations
 * Get all explanations for a question
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questionId = parseInt(id, 10);
    
    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: "Invalid question ID" },
        { status: 400 }
      );
    }
    
    const explanations = await getExplanations(questionId);
    
    return NextResponse.json(explanations);
  } catch (error) {
    console.error("Error fetching explanations:", error);
    return NextResponse.json(
      { error: "Failed to fetch explanations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/questions/[id]/explanations
 * Save a new explanation for a question
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questionId = parseInt(id, 10);
    
    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: "Invalid question ID" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { userId, explanation } = body;
    
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }
    
    if (!explanation || typeof explanation !== "string") {
      return NextResponse.json(
        { error: "explanation is required" },
        { status: 400 }
      );
    }
    
    const newExplanation = await createExplanation({
      questionId,
      userId,
      explanation,
    });
    
    return NextResponse.json(newExplanation, { status: 201 });
  } catch (error) {
    console.error("Error creating explanation:", error);
    return NextResponse.json(
      { error: "Failed to create explanation" },
      { status: 500 }
    );
  }
}

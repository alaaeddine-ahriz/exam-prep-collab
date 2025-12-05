import { NextRequest, NextResponse } from "next/server";
import { getDataService } from "@/app/lib/services";

// CORS headers for admin tool access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const service = await getDataService();
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    let questions;
    if (search) {
      questions = await service.questions.searchQuestions(search);
    } else if (type && (type === "mcq" || type === "saq")) {
      questions = await service.questions.getQuestionsByType(type);
    } else {
      questions = await service.questions.getAllQuestions();
    }

    return NextResponse.json(questions, { headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const service = await getDataService();
    const body = await request.json();

    let question;
    if (body.type === "mcq") {
      question = await service.questions.createMCQQuestion({
        question: body.question,
        createdBy: body.createdBy,
        options: body.options,
      });
    } else {
      question = await service.questions.createSAQQuestion({
        question: body.question,
        createdBy: body.createdBy,
      });
    }

    return NextResponse.json(question, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500, headers: corsHeaders });
  }
}


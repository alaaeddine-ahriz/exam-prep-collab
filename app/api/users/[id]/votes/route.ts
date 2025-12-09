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

    // Fetch all votes in a single query instead of N sequential queries
    const votes = await service.questions.getAllUserVotes(id);

    return NextResponse.json(votes);
  } catch (error) {
    console.error("Error fetching user votes:", error);
    return NextResponse.json({ error: "Failed to fetch votes" }, { status: 500 });
  }
}


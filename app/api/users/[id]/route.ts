import { NextRequest, NextResponse } from "next/server";
import { getDataService } from "@/app/lib/services";
import { env } from "@/app/lib/config/env";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Don't create records for "local-user" in production with Supabase
    if (id === "local-user" && env.dataProvider === "supabase") {
      return NextResponse.json({
        id: "local-user",
        name: "Guest",
        email: "guest@local",
        stats: {
          totalAnswered: 0,
          correctAnswers: 0,
          mcqAnswered: 0,
          mcqCorrect: 0,
          saqAnswered: 0,
          saqCorrect: 0,
          streak: 0,
          lastActive: new Date(),
        },
        history: [],
        joinedAt: new Date(),
        examDate: null,
      });
    }

    const service = await getDataService();

    // Get user's email from the request header if available (set by auth middleware)
    const userEmail = request.headers.get("x-user-email");

    let user = await service.users.getUserById(id);

    // If user doesn't exist, create them with default values
    // The name will be updated when they take actions
    if (!user) {
      // Extract a display name from the ID or email
      const displayName = userEmail
        ? userEmail.split("@")[0]
        : id.includes("@")
          ? id.split("@")[0]
          : id === "local-user"
            ? "Guest"
            : "User";

      user = await service.users.createUser({
        id,
        name: displayName,
        email: userEmail || (id.includes("@") ? id : `${id}@local`),
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

/**
 * PATCH /api/users/[id]
 * Update user settings (e.g., exam_date for cram mode, name for profile)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { exam_date, name } = body;

    const service = await getDataService();

    // Update exam_date if provided
    if (exam_date !== undefined) {
      await service.users.updateExamDate(id, exam_date);
    }

    // Update name if provided
    if (name !== undefined && name.trim()) {
      await service.users.updateName(id, name.trim());
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getDataService } from "@/app/lib/services";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await getDataService();
    
    let user = await service.users.getUserById(id);

    // If user doesn't exist, create them with default values
    // The name will be updated when they take actions
    if (!user) {
      // Extract a display name from the ID (could be an email or UUID)
      const displayName = id.includes("@") 
        ? id.split("@")[0] 
        : id === "local-user" 
          ? "Guest" 
          : "User";
      
      user = await service.users.createUser({
        id,
        name: displayName,
        email: id.includes("@") ? id : `${id}@local`,
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
 * Update user settings (e.g., exam_date for cram mode)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { exam_date } = body;

    const service = await getDataService();
    
    // Update exam_date in database
    await service.users.updateExamDate(id, exam_date);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}


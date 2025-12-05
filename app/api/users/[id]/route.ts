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

    // If default user doesn't exist, create it
    if (!user && id === "default-user") {
      user = await service.users.createUser({
        id: "default-user",
        name: "Alex Student",
        email: "alex@kaist.ac.kr",
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


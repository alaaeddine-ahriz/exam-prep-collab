import { NextResponse } from "next/server";
import { isAIEnabled } from "@/app/lib/services/ai";

export async function GET() {
  return NextResponse.json({
    enabled: isAIEnabled(),
  });
}

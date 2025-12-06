import { NextResponse } from "next/server";
import { SupabaseLeaderboardService } from "@/app/lib/services/supabase/leaderboardService";
import { LeaderboardFilter } from "@/app/lib/services/leaderboardTypes";

const leaderboardService = new SupabaseLeaderboardService();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const filter = (searchParams.get("filter") as LeaderboardFilter) || "overall";
        const userId = searchParams.get("userId");
        const limit = parseInt(searchParams.get("limit") || "50");

        const entries = await leaderboardService.getLeaderboard(filter, limit);

        let currentUser = null;
        if (userId) {
            currentUser = await leaderboardService.getUserRank(userId, filter);
        }

        return NextResponse.json({
            entries,
            currentUser,
        });
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return NextResponse.json(
            { error: "Failed to fetch leaderboard" },
            { status: 500 }
        );
    }
}

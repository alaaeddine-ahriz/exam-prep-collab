import { LeaderboardEntry, LeaderboardFilter } from "../leaderboardTypes";
import { getSupabaseClient } from "./client";

export class SupabaseLeaderboardService {
    async getLeaderboard(
        filter: LeaderboardFilter = "overall",
        limit: number = 50
    ): Promise<LeaderboardEntry[]> {
        const supabase = getSupabaseClient();

        // Get vote counts per user
        const { data: votes } = await supabase
            .from("votes")
            .select("user_id");

        // Get SAQ answer counts per user
        const { data: answers } = await supabase
            .from("saq_answers")
            .select("created_by");

        // Get all users
        const { data: users } = await supabase
            .from("users")
            .select("id, name, email, avatar_url");

        if (!users) return [];

        // Count votes per user
        const voteCountMap = new Map<string, number>();
        (votes || []).forEach((v: { user_id: string }) => {
            const count = voteCountMap.get(v.user_id) || 0;
            voteCountMap.set(v.user_id, count + 1);
        });

        // Count answers per user
        const answerCountMap = new Map<string, number>();
        (answers || []).forEach((a: { created_by: string }) => {
            const count = answerCountMap.get(a.created_by) || 0;
            answerCountMap.set(a.created_by, count + 1);
        });

        // Build leaderboard entries
        const entries: Omit<LeaderboardEntry, "rank">[] = users.map((user: { id: string; name: string; email: string; avatar_url: string | null }) => {
            const voteCount = voteCountMap.get(user.id) || 0;
            const answerCount = answerCountMap.get(user.id) || 0;
            const totalPoints = voteCount + answerCount * 2;

            // Use email prefix as display name if the name is generic
            let displayName = user.name;
            if (user.name === "User" || user.name === "Dev User" || !user.name) {
                displayName = user.email?.split("@")[0] || user.name || "Unknown";
            }

            return {
                userId: user.id,
                name: displayName,
                avatarUrl: user.avatar_url,
                voteCount,
                answerCount,
                totalPoints,
            };
        });

        // Sort by the appropriate metric
        let sortedEntries: Omit<LeaderboardEntry, "rank">[];
        switch (filter) {
            case "voting":
                sortedEntries = entries.sort((a, b) => b.voteCount - a.voteCount);
                break;
            case "answers":
                sortedEntries = entries.sort((a, b) => b.answerCount - a.answerCount);
                break;
            default: // "overall"
                sortedEntries = entries.sort((a, b) => b.totalPoints - a.totalPoints);
        }

        // Filter out users with no contributions and add ranks
        return sortedEntries
            .filter((e) => e.totalPoints > 0 || e.voteCount > 0 || e.answerCount > 0)
            .slice(0, limit)
            .map((entry, index) => ({
                ...entry,
                rank: index + 1,
            }));
    }

    async getUserRank(
        userId: string,
        filter: LeaderboardFilter = "overall"
    ): Promise<LeaderboardEntry | null> {
        const allEntries = await this.getLeaderboard(filter, 1000);
        return allEntries.find((e) => e.userId === userId) || null;
    }
}

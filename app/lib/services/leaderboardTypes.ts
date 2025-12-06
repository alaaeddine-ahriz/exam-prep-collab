// Leaderboard types for ranking users by contributions

export type LeaderboardFilter = "overall" | "voting" | "answers";

export interface LeaderboardEntry {
    userId: string;
    name: string;
    avatarUrl: string | null;
    rank: number;
    voteCount: number;      // Total votes cast
    answerCount: number;    // SAQ answers submitted
    totalPoints: number;    // voteCount + (answerCount * 2)
}

export interface LeaderboardData {
    entries: LeaderboardEntry[];
    currentUser: LeaderboardEntry | null;
}

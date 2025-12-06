"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    TopAppBar,
    SegmentedControl,
    LeaderboardRankCard,
    CurrentUserCard,
} from "../components";
import { useAuth } from "../context/AuthContext";
import { LeaderboardEntry, LeaderboardFilter } from "../lib/services/leaderboardTypes";

const FILTER_OPTIONS = [
    { value: "overall", label: "Overall" },
    { value: "voting", label: "Voting" },
    { value: "answers", label: "Answers" },
];

export default function LeaderboardPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [filter, setFilter] = useState<LeaderboardFilter>("overall");
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [currentUser, setCurrentUser] = useState<LeaderboardEntry | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeaderboard() {
            setLoading(true);
            try {
                const params = new URLSearchParams({ filter });
                if (user?.id) {
                    params.set("userId", user.id);
                }

                const res = await fetch(`/api/leaderboard?${params}`);
                const data = await res.json();

                setEntries(data.entries || []);
                setCurrentUser(data.currentUser || null);
            } catch (error) {
                console.error("Failed to fetch leaderboard:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchLeaderboard();
    }, [filter, user?.id]);

    const getPointsLabel = () => {
        switch (filter) {
            case "voting":
                return "Votes";
            case "answers":
                return "Answers";
            default:
                return "Points";
        }
    };

    const getPoints = (entry: LeaderboardEntry) => {
        switch (filter) {
            case "voting":
                return entry.voteCount;
            case "answers":
                return entry.answerCount;
            default:
                return entry.totalPoints;
        }
    };

    return (
        <div className="relative flex h-auto min-h-dvh w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
            {/* Top App Bar */}
            <TopAppBar title="Leaderboard" onBack={() => router.back()} />

            {/* Segmented Control for filtering */}
            <SegmentedControl
                options={FILTER_OPTIONS}
                value={filter}
                onChange={(value) => setFilter(value as LeaderboardFilter)}
            />

            {/* Leaderboard List */}
            <div className="flex flex-col gap-2 px-4 pb-4 flex-1">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
                        <p className="text-lg font-medium">No contributions yet</p>
                        <p className="text-sm">Be the first to vote or submit answers!</p>
                    </div>
                ) : (
                    entries.map((entry) => (
                        <LeaderboardRankCard
                            key={entry.userId}
                            rank={entry.rank}
                            name={entry.name}
                            avatarUrl={entry.avatarUrl}
                            points={getPoints(entry)}
                            pointsLabel={getPointsLabel()}
                        />
                    ))
                )}
            </div>

            {/* Sticky Current User Card */}
            {isAuthenticated && currentUser && (
                <CurrentUserCard
                    rank={currentUser.rank}
                    name={currentUser.name}
                    avatarUrl={currentUser.avatarUrl}
                    points={getPoints(currentUser)}
                    pointsLabel={getPointsLabel()}
                />
            )}
        </div>
    );
}

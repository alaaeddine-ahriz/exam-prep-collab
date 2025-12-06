"use client";

import { Icon } from "./Icon";

interface LeaderboardRankCardProps {
    rank: number;
    name: string;
    avatarUrl: string | null;
    points: number;
    pointsLabel?: string;
}

export function LeaderboardRankCard({
    rank,
    name,
    avatarUrl,
    points,
    pointsLabel = "Points",
}: LeaderboardRankCardProps) {
    // Trophy colors for top 3
    const getTrophyColor = (rank: number) => {
        switch (rank) {
            case 1:
                return "text-yellow-400"; // Gold
            case 2:
                return "text-gray-400 dark:text-gray-500"; // Silver
            case 3:
                return "text-orange-400"; // Bronze
            default:
                return null;
        }
    };

    const trophyColor = getTrophyColor(rank);
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="flex items-center gap-4 rounded-xl bg-surface-light dark:bg-slate-800/50 p-4 shadow-sm">
            {/* Trophy or empty space */}
            <div className="flex w-8 shrink-0 items-center justify-center">
                {trophyColor && (
                    <Icon name="emoji_events" className={`text-3xl ${trophyColor}`} />
                )}
            </div>

            {/* Avatar and info */}
            <div className="flex flex-1 items-center gap-4">
                {avatarUrl ? (
                    <div
                        className="h-12 w-12 shrink-0 rounded-full bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url("${avatarUrl}")` }}
                    />
                ) : (
                    <div className="h-12 w-12 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {initials}
                    </div>
                )}
                <div className="flex flex-col justify-center">
                    <p className="line-clamp-1 text-base font-medium text-text-primary-light dark:text-text-primary-dark">
                        {name}
                    </p>
                    <p className="line-clamp-1 text-sm font-normal text-text-secondary-light dark:text-text-secondary-dark">
                        {points.toLocaleString()} {pointsLabel}
                    </p>
                </div>
            </div>

            {/* Rank number */}
            <div className="shrink-0">
                <p className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    {rank}
                </p>
            </div>
        </div>
    );
}

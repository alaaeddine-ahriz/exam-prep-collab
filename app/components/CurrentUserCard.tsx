"use client";

interface CurrentUserCardProps {
    rank: number;
    name: string;
    avatarUrl: string | null;
    points: number;
    pointsLabel?: string;
}

export function CurrentUserCard({
    rank,
    name,
    avatarUrl,
    points,
    pointsLabel = "Points",
}: CurrentUserCardProps) {
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="sticky bottom-0 mt-auto bg-background-light dark:bg-background-dark p-4">
            <div className="flex items-stretch justify-between gap-4 rounded-xl bg-primary/20 dark:bg-primary/30 p-4">
                <div className="flex flex-[2_2_0px] flex-col justify-center gap-1">
                    <p className="text-sm font-medium text-primary dark:text-cyan-200">
                        You are #{rank}
                    </p>
                    <p className="text-base font-bold text-text-primary-light dark:text-white">
                        {name}
                    </p>
                    <p className="text-sm font-normal text-text-secondary-light dark:text-gray-300">
                        {points.toLocaleString()} {pointsLabel}
                    </p>
                </div>
                <div className="flex-1">
                    {avatarUrl ? (
                        <div
                            className="aspect-square w-full rounded-xl bg-cover bg-center bg-no-repeat"
                            style={{ backgroundImage: `url("${avatarUrl}")` }}
                        />
                    ) : (
                        <div className="aspect-square w-full rounded-xl bg-primary/30 flex items-center justify-center text-primary text-2xl font-bold">
                            {initials}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

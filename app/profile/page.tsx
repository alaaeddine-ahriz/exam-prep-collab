"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Icon,
  TopAppBar,
  ProgressBar,
  ProtectedRoute,
  BottomSheet,
  Button,
} from "../components";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

// Achievement data
const ACHIEVEMENTS = [
  {
    id: "hot-streak",
    icon: "local_fire_department",
    label: "Hot Streak",
    description: "Answer 10 or more questions",
    requirement: (stats: { totalAnswered: number; correctAnswers: number }) =>
      stats.totalAnswered >= 10,
  },
  {
    id: "quick-starter",
    icon: "rocket_launch",
    label: "Quick Starter",
    description: "Answer your first question",
    requirement: (stats: { totalAnswered: number; correctAnswers: number }) =>
      stats.totalAnswered >= 1,
  },
  {
    id: "top-contributor",
    icon: "verified",
    label: "Top Contributor",
    description: "Get 50 correct answers",
    requirement: (stats: { totalAnswered: number; correctAnswers: number }) =>
      stats.correctAnswers >= 50,
  },
  {
    id: "perfectionist",
    icon: "emoji_events",
    label: "Perfectionist",
    description: "Achieve 100% accuracy with 10+ questions",
    requirement: (stats: { totalAnswered: number; correctAnswers: number }) =>
      stats.totalAnswered >= 10 &&
      stats.correctAnswers === stats.totalAnswered,
  },
  {
    id: "scholar",
    icon: "school",
    label: "Scholar",
    description: "Answer 100 questions",
    requirement: (stats: { totalAnswered: number; correctAnswers: number }) =>
      stats.totalAnswered >= 100,
  },
  {
    id: "expert",
    icon: "psychology",
    label: "Expert",
    description: "Maintain 80%+ accuracy with 50+ questions",
    requirement: (stats: { totalAnswered: number; correctAnswers: number }) =>
      stats.totalAnswered >= 50 &&
      stats.correctAnswers / stats.totalAnswered >= 0.8,
  },
];

// Stat Card Component
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg p-4 border border-border-light dark:border-border-dark">
      <p className="text-base font-medium leading-normal text-text-secondary-light dark:text-text-secondary-dark">
        {label}
      </p>
      <p className="tracking-tight text-2xl font-bold leading-tight text-text-primary-light dark:text-text-primary-dark">
        {value}
      </p>
    </div>
  );
}

// Achievement Badge Component
function AchievementBadge({
  icon,
  label,
  description,
  unlocked = true,
  showDescription = false,
}: {
  icon: string;
  label: string;
  description?: string;
  unlocked?: boolean;
  showDescription?: boolean;
}) {
  if (showDescription) {
    return (
      <div
        className={`flex items-center gap-4 p-4 rounded-xl border ${
          unlocked
            ? "border-primary/30 bg-primary/5"
            : "border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark"
        }`}
      >
        <div
          className={`flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0 ${
            unlocked
              ? "bg-primary/20 text-primary"
              : "bg-border-light dark:bg-border-dark text-text-secondary-light dark:text-text-secondary-dark"
          }`}
        >
          <Icon name={unlocked ? icon : "lock"} size="lg" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`font-bold ${
              unlocked
                ? "text-text-primary-light dark:text-text-primary-dark"
                : "text-text-secondary-light dark:text-text-secondary-dark"
            }`}
          >
            {label}
          </p>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {description}
          </p>
        </div>
        {unlocked && (
          <Icon name="check_circle" className="text-primary flex-shrink-0" />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0 w-20">
      <div
        className={`flex items-center justify-center w-16 h-16 rounded-full ${
          unlocked
            ? "bg-primary/20 text-primary"
            : "bg-border-light dark:bg-border-dark text-text-secondary-light dark:text-text-secondary-dark"
        }`}
      >
        <Icon name={unlocked ? icon : "lock"} size="xl" />
      </div>
      <p className="text-xs text-center font-medium text-text-secondary-light dark:text-text-secondary-dark">
        {label}
      </p>
    </div>
  );
}

// Menu Item Component
function MenuItem({
  icon,
  label,
  onClick,
  href,
  variant = "default",
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "danger";
}) {
  const isDanger = variant === "danger";

  const content = (
    <>
      <Icon
        name={icon}
        className={
          isDanger
            ? "text-error"
            : "text-text-secondary-light dark:text-text-secondary-dark"
        }
      />
      <span
        className={`flex-1 text-base font-medium ${
          isDanger
            ? "text-error"
            : "text-text-primary-light dark:text-text-primary-dark"
        }`}
      >
        {label}
      </span>
      {!isDanger && (
        <Icon
          name="chevron_right"
          className="text-text-secondary-light dark:text-text-secondary-dark"
        />
      )}
    </>
  );

  const className = `flex items-center p-4 gap-4 w-full text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
    isDanger ? "text-error" : ""
  }`;

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const { user: appUser } = useApp();
  const { user: authUser, signOut } = useAuth();

  // Bottom sheet states
  const [showAchievements, setShowAchievements] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Edit profile state
  const [editName, setEditName] = useState("");

  // User display info
  const displayName =
    authUser?.email?.split("@")[0] || appUser?.name || "User";
  const displaySubtitle =
    authUser?.email || appUser?.email || "Student";

  // Stats calculations
  const totalAnswered = appUser?.stats?.totalAnswered ?? 0;
  const correctAnswers = appUser?.stats?.correctAnswers ?? 0;
  const accuracy =
    totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
  const upvoted = 0; // Placeholder - could be fetched from user stats

  const stats = { totalAnswered, correctAnswers };

  // Count unlocked achievements
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.requirement(stats)).length;

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const handleHelpSupport = () => {
    window.location.href = "mailto:alaaahriz@gmail.com?subject=ExamPrep Support Request";
  };

  const handleEditProfile = () => {
    setEditName(displayName);
    setShowEditProfile(true);
  };

  const handleSaveProfile = () => {
    // In a real app, this would update the user's profile in the backend
    // For now, we'll just close the sheet
    setShowEditProfile(false);
    // Could dispatch to app context or make API call here
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      {/* Top App Bar */}
      <TopAppBar
        title="Profile"
        onBack={() => router.back()}
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-8">
        {/* Profile Header */}
        <div className="flex p-4">
          <div className="flex w-full flex-col gap-4 items-center">
            <div className="flex gap-4 flex-col items-center">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white text-5xl font-bold shadow-md border-4 border-white dark:border-surface-dark">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </div>
              {/* Name & Subtitle */}
              <div className="flex flex-col items-center justify-center">
                <p className="text-[22px] font-bold leading-tight tracking-tight text-center text-text-primary-light dark:text-text-primary-dark">
                  {displayName}
                </p>
                <p className="text-base font-normal leading-normal text-center text-text-secondary-light dark:text-text-secondary-dark">
                  {displaySubtitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* My Statistics Section */}
        <div className="px-4">
          <Card className="flex flex-col gap-4">
            <h3 className="text-lg font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">
              My Statistics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Answered" value={totalAnswered.toLocaleString()} />
              <StatCard label="Correct" value={correctAnswers.toLocaleString()} />
              <StatCard label="Accuracy" value={`${accuracy}%`} />
              <StatCard label="Upvoted" value={upvoted.toLocaleString()} />
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-6 justify-between">
                <p className="text-base font-medium leading-normal text-text-primary-light dark:text-text-primary-dark">
                  Practice Accuracy
                </p>
                <p className="text-sm font-normal leading-normal text-text-primary-light dark:text-text-primary-dark">
                  {accuracy}%
                </p>
              </div>
              <ProgressBar value={accuracy} variant="primary" size="md" />
            </div>
          </Card>
        </div>

        {/* Achievements Section */}
        <div className="px-4 mt-4">
          <Card className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">
                Achievements
                <span className="ml-2 text-sm font-normal text-text-secondary-light dark:text-text-secondary-dark">
                  ({unlockedCount}/{ACHIEVEMENTS.length})
                </span>
              </h3>
              <button
                onClick={() => setShowAchievements(true)}
                className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >
                View All
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
              {ACHIEVEMENTS.slice(0, 4).map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  icon={achievement.icon}
                  label={achievement.label}
                  unlocked={achievement.requirement(stats)}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Account Management Section */}
        <div className="px-4 mt-4">
          <Card padding="none" className="flex flex-col overflow-hidden">
            <MenuItem
              icon="person"
              label="Edit Profile"
              onClick={handleEditProfile}
            />
            <hr className="border-t border-border-light dark:border-border-dark mx-4" />
            <MenuItem
              icon="help_outline"
              label="Help & Support"
              onClick={handleHelpSupport}
            />
            <hr className="border-t border-border-light dark:border-border-dark mx-4" />
            <MenuItem
              icon="logout"
              label="Logout"
              variant="danger"
              onClick={handleLogout}
            />
          </Card>
        </div>
      </div>

      {/* Achievements Bottom Sheet */}
      <BottomSheet
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
        title="All Achievements"
      >
        <div className="p-4 flex flex-col gap-3">
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">
            You&apos;ve unlocked {unlockedCount} of {ACHIEVEMENTS.length} achievements
          </p>
          {ACHIEVEMENTS.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              icon={achievement.icon}
              label={achievement.label}
              description={achievement.description}
              unlocked={achievement.requirement(stats)}
              showDescription
            />
          ))}
        </div>
      </BottomSheet>

      {/* Edit Profile Bottom Sheet */}
      <BottomSheet
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title="Edit Profile"
      >
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              Display Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              Email
            </label>
            <input
              type="email"
              value={authUser?.email || ""}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-border-light dark:bg-border-dark text-text-secondary-light dark:text-text-secondary-dark cursor-not-allowed"
            />
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              Email cannot be changed
            </p>
          </div>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowEditProfile(false)}
            >
              Cancel
            </Button>
            <Button fullWidth onClick={handleSaveProfile}>
              Save Changes
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}

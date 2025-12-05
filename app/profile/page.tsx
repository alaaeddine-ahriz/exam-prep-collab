"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  Icon,
  Button,
  TopAppBar,
  ProtectedRoute,
} from "../components";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

function ProfilePageContent() {
  const router = useRouter();
  const { user: appUser } = useApp();
  const { user: authUser, signOut } = useAuth();

  // Use auth user email if available, otherwise fall back to app user
  const displayName = authUser?.email?.split("@")[0] || appUser?.name || "User";
  const displayEmail = authUser?.email || appUser?.email || "";

  const accuracy = (appUser?.stats?.totalAnswered ?? 0) > 0
    ? Math.round(((appUser?.stats?.correctAnswers ?? 0) / (appUser?.stats?.totalAnswered ?? 1)) * 100)
    : 0;

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      {/* Header */}
      <TopAppBar
        title="Profile"
        onBack={() => router.back()}
      />

      {/* Profile Header */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-4 ring-4 ring-background-light dark:ring-background-dark">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="absolute bottom-2 right-0 w-8 h-8 bg-surface-light dark:bg-surface-dark rounded-full flex items-center justify-center shadow-sm border border-border-light dark:border-border-dark">
            <span className="text-lg">🎓</span>
          </div>
        </div>
        <h1 className="text-text-primary-light dark:text-text-primary-dark text-2xl font-bold mb-1">
          {displayName}
        </h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm bg-surface-light dark:bg-surface-dark px-3 py-1 rounded-full border border-border-light dark:border-border-dark">
          {displayEmail}
        </p>
      </div>

      <main className="flex-grow px-6 pb-8">
        {/* Stats Overview - Modern Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl border border-border-light dark:border-border-dark shadow-sm text-center flex flex-col items-center justify-center aspect-square">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
              <Icon name="check_circle" size="sm" />
            </div>
            <p className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark leading-none mb-1">
              {accuracy}%
            </p>
            <p className="text-[10px] uppercase tracking-wider font-bold text-text-secondary-light dark:text-text-secondary-dark">
              Accuracy
            </p>
          </div>

          <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl border border-border-light dark:border-border-dark shadow-sm text-center flex flex-col items-center justify-center aspect-square">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success mb-2">
              <Icon name="assignment" size="sm" />
            </div>
            <p className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark leading-none mb-1">
              {appUser?.stats?.totalAnswered || 0}
            </p>
            <p className="text-[10px] uppercase tracking-wider font-bold text-text-secondary-light dark:text-text-secondary-dark">
              Done
            </p>
          </div>

          <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl border border-border-light dark:border-border-dark shadow-sm text-center flex flex-col items-center justify-center aspect-square">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning mb-2">
              <Icon name="emoji_events" size="sm" />
            </div>
            <p className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark leading-none mb-1">
              {appUser?.stats?.correctAnswers || 0}
            </p>
            <p className="text-[10px] uppercase tracking-wider font-bold text-text-secondary-light dark:text-text-secondary-dark">
              Correct
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-3 pl-1">
          Menu
        </h2>
        <div className="flex flex-col gap-3 mb-8">
          <button 
            onClick={() => router.push("/questions")}
            className="flex items-center gap-4 p-4 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-primary/50 active:scale-[0.99] transition-all shadow-sm text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Icon name="search" size="md" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark">Question Bank</h3>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Browse all questions</p>
            </div>
            <Icon name="chevron_right" className="text-text-secondary-light dark:text-text-secondary-dark" />
          </button>

          <button 
            onClick={() => router.push("/practice/setup")}
            className="flex items-center gap-4 p-4 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-primary/50 active:scale-[0.99] transition-all shadow-sm text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Icon name="play_arrow" size="md" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark">Practice Mode</h3>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Start a quiz</p>
            </div>
            <Icon name="chevron_right" className="text-text-secondary-light dark:text-text-secondary-dark" />
          </button>
        </div>

        {/* Sign Out */}
        <Button
          variant="destructive"
          fullWidth
          onClick={handleLogout}
          className="h-14 rounded-2xl font-bold text-base shadow-md"
        >
          <Icon name="logout" size="sm" />
          Sign Out
        </Button>
      </main>
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


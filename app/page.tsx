"use client";

import { useRouter } from "next/navigation";
import {
  Button,
  Icon,
} from "./components";
import { useAuth } from "./context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Authenticated users home screen
  if (isAuthenticated) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark px-4">
        <div className="flex flex-col items-center w-full max-w-sm">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg mb-2">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <h1 className="text-text-primary-light dark:text-text-primary-dark tracking-tight text-2xl font-bold leading-tight text-center pb-2">
            Welcome back!
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-base font-normal leading-normal pb-8 text-center">
            {user?.email}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 w-full">
            <Button variant="primary" fullWidth onClick={() => router.push("/questions")}>
              <Icon name="quiz" size="sm" />
              Go to Question Bank
            </Button>
            <Button variant="secondary" fullWidth onClick={() => router.push("/practice/setup")}>
              <Icon name="play_arrow" size="sm" />
              Start Practice Mode
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default: Show welcome screen for non-authenticated users
  return (
    <div className="flex min-h-dvh w-full flex-col bg-background-light dark:bg-background-dark justify-center">
      {/* Content */}
      <div className="flex flex-col flex-1 px-6 py-12 max-w-md mx-auto w-full">
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-text-primary-light dark:text-text-primary-dark tracking-tight text-5xl font-extrabold leading-[1.1] text-center pb-6">
            Ace Your<br />Next Exam
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-xl font-medium leading-relaxed pb-12 text-center max-w-[300px] mx-auto">
            Collaborative preparation for better results.
          </p>

          {/* Feature List - Simplified */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon name="search" size="md" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">Access Question Bank</h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">Browse past exam questions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0">
                <Icon name="thumb_up" size="md" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">Vote on Answers</h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">Find the best solutions</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm">
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center text-warning shrink-0">
                <Icon name="timer" size="md" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">Practice Mode</h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">Test your knowledge</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 mt-auto">
          <Button variant="primary" size="lg" fullWidth onClick={() => router.push("/auth/signup")} className="h-14 text-lg">
            Get Started
          </Button>
          <Button variant="ghost" fullWidth onClick={() => router.push("/auth/login")} className="text-base">
            I already have an account
          </Button>
        </div>
      </div>
    </div>
  );
}

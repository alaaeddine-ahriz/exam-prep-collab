"use client";

import { useRouter } from "next/navigation";
import {
  Button,
  FeatureCard,
  PageIndicator,
  Icon,
} from "./components";
import { useAuth } from "./context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Redirect authenticated users to questions
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        {/* Hero Image */}
        <div className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden min-h-64"
          style={{
            backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCanXF9RJnANKIOY3UP9OY_YO5kXLg4L7f3f9UKit_HDfr7C68pu2lOP0oKX-8v5fjLWQVYwNWIMzQJJ_HYHsCxq7x_ufm0PR8nRQP0QlCZAbvK8hknqSLoyvcL0UHV3OQFjD2ILC1wpZnn7xfceGO6kSANbIb4sWZAmN-GaUOcOmDhReA0raipc7Pdeawf6CfFjMYpn6HZ6H-grM91XF5I_XhBFFzLrlj3A6G7lzuiL65Aknc1klUEOClZtLvEWoI-F3LDAu4_-Bo")`
          }}
        />

        {/* Content */}
        <div className="flex flex-col flex-1 px-4">
          <div className="flex items-center justify-center gap-2 pt-6 pb-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
          <h1 className="text-text-primary-light dark:text-text-primary-dark tracking-tight text-2xl font-bold leading-tight text-center pb-2">
            Welcome back!
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-base font-normal leading-normal pb-3 text-center">
            {user?.email}
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 py-4">
            <FeatureCard
              icon="quiz"
              title="Question Bank"
              description="Browse and vote on exam questions."
            />
            <FeatureCard
              icon="play_arrow"
              title="Practice Mode"
              description="Test yourself with quizzes."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-auto pb-8">
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
    <div className="flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark justify-center">
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

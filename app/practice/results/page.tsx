"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button, ProtectedRoute } from "../../components";

function PracticeResultsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const correct = Number(searchParams.get("correct")) || 0;
  const total = Number(searchParams.get("total")) || 1;
  const percentage = Math.round((correct / total) * 100);
  const toReview = total - correct;

  const getMessage = () => {
    if (percentage >= 90) return "Outstanding!";
    if (percentage >= 70) return "Great job!";
    if (percentage >= 50) return "Good effort!";
    return "Keep practicing!";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Score Circle */}
        <div className="relative w-48 h-48 mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-border-light dark:text-border-dark"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - percentage / 100)}`}
              strokeLinecap="round"
              className="text-primary transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
          {getMessage()}
        </h1>
        
        {/* Stats integrated in text */}
        <p className="text-text-secondary-light dark:text-text-secondary-dark text-center mb-8 leading-relaxed">
          You got <span className="font-semibold text-success">{correct} correct</span> out of {total} questions.
          {toReview > 0 && (
            <>
              <br />
              <span className="font-semibold text-error">{toReview} to review</span> to improve your score.
            </>
          )}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Button variant="primary" fullWidth onClick={() => router.push("/practice/setup")}>
            Practice Again
          </Button>
          <Button variant="secondary" fullWidth onClick={() => router.push("/questions")}>
            Browse Questions
          </Button>
          <Button variant="ghost" fullWidth onClick={() => router.push("/profile")}>
            View Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PracticeResultsPage() {
  return (
    <ProtectedRoute>
      <PracticeResultsPageContent />
    </ProtectedRoute>
  );
}


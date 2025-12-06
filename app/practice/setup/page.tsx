"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RadioOption,
  Slider,
  Button,
  Icon,
  ProtectedRoute,
  Card,
} from "../../components";
import { useApp } from "../../context/AppContext";

function PracticeModeSetupPageContent() {
  const router = useRouter();
  const { questions, masteryStats, isCramModeActive, daysUntilExam } = useApp();
  
  const [questionSource, setQuestionSource] = useState<"all" | "mcq" | "saq">("all");
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);

  const filteredCount = questions.filter((q) => 
    questionSource === "all" || q.type === questionSource
  ).length;

  const maxQuestions = Math.min(filteredCount, 50);

  const handleStartPractice = () => {
    const params = new URLSearchParams({
      source: questionSource,
      count: String(Math.min(numberOfQuestions, maxQuestions)),
    });
    
    router.push(`/practice/quiz?${params.toString()}`);
  };

  // Get mode info text based on global settings
  const getModeInfo = () => {
    if (isCramModeActive && daysUntilExam !== null) {
      return `Cram Mode: ${daysUntilExam} day${daysUntilExam !== 1 ? "s" : ""} until exam`;
    }
    return masteryStats?.dueToday 
      ? `Smart Review: ${masteryStats.dueToday} questions due`
      : "Smart Review: Prioritizes questions you need to practice";
  };

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-background-light dark:bg-background-dark">
      {/* Top App Bar */}
      <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
        <div className="flex items-center p-4 justify-between">
          <button
            onClick={() => router.back()}
            className="flex size-10 items-center justify-center rounded-full text-text-primary-light dark:text-text-primary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <Icon name="close" />
          </button>
          <h1 className="text-text-primary-light dark:text-text-primary-dark text-lg font-bold leading-tight tracking-tight">
            Practice Setup
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-grow px-4 py-4 pb-28 space-y-6">
        {/* Current Mode Info */}
        <Card className={isCramModeActive 
          ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800" 
          : "bg-primary/5 dark:bg-primary/10 border-primary/20"
        }>
          <div className="flex items-center gap-3">
            <Icon 
              name={isCramModeActive ? "bolt" : "psychology"} 
              className={isCramModeActive ? "text-violet-600 dark:text-violet-400" : "text-primary"} 
            />
            <div className="flex-1">
              <p className={`text-sm font-medium ${isCramModeActive ? "text-violet-800 dark:text-violet-200" : "text-text-primary-light dark:text-text-primary-dark"}`}>
                {getModeInfo()}
              </p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                {isCramModeActive 
                  ? "Change cram mode settings in your Profile" 
                  : "Enable cram mode in your Profile for exam prep"
                }
              </p>
            </div>
          </div>
        </Card>

        {/* Question Type Selection */}
        <section>
          <h2 className="text-text-primary-light dark:text-text-primary-dark tracking-tight text-xl font-bold leading-tight pb-3">
            Question Type
        </h2>
          <div className="flex flex-col gap-3">
          <RadioOption
            id="all"
            name="question_source"
            label="All Questions"
              description={`Practice from all ${questions.length} questions`}
            checked={questionSource === "all"}
            onChange={() => setQuestionSource("all")}
          />
          <RadioOption
            id="mcq"
            name="question_source"
            label="Multiple Choice Only"
              description={`${questions.filter(q => q.type === "mcq").length} MCQ questions`}
            checked={questionSource === "mcq"}
            onChange={() => setQuestionSource("mcq")}
          />
          <RadioOption
            id="saq"
            name="question_source"
            label="Short Answer Only"
              description={`${questions.filter(q => q.type === "saq").length} SAQ questions`}
            checked={questionSource === "saq"}
            onChange={() => setQuestionSource("saq")}
          />
        </div>
        </section>

        {/* Number of Questions Slider */}
        <section>
        <Slider
          label="Number of Questions"
          value={Math.min(numberOfQuestions, maxQuestions)}
          min={1}
          max={maxQuestions}
          step={1}
          onChange={setNumberOfQuestions}
        />
        </section>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={handleStartPractice}
          disabled={filteredCount === 0}
        >
          Start Practice ({Math.min(numberOfQuestions, maxQuestions)} questions)
        </Button>
      </div>
    </div>
  );
}

export default function PracticeModeSetupPage() {
  return (
    <ProtectedRoute>
      <PracticeModeSetupPageContent />
    </ProtectedRoute>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RadioOption,
  Slider,
  Button,
  Icon,
  ProtectedRoute,
} from "../../components";
import { useApp } from "../../context/AppContext";

function PracticeModeSetupPageContent() {
  const router = useRouter();
  const { questions } = useApp();
  
  const [questionSource, setQuestionSource] = useState<"all" | "mcq" | "saq">("all");
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);

  const filteredCount = questions.filter((q) => 
    questionSource === "all" || q.type === questionSource
  ).length;

  const maxQuestions = Math.min(filteredCount, 50);

  const handleStartPractice = () => {
    router.push(`/practice/quiz?source=${questionSource}&count=${numberOfQuestions}`);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
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
            Practice Mode
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-grow px-4 py-4 pb-28">
        {/* Headline Text */}
        <h2 className="text-text-primary-light dark:text-text-primary-dark tracking-tight text-2xl font-bold leading-tight pb-4">
          Choose your question type
        </h2>

        {/* Radio List */}
        <div className="flex flex-col gap-3 mb-6">
          <RadioOption
            id="all"
            name="question_source"
            label="All Questions"
            description={`Practice from all ${questions.length} questions.`}
            checked={questionSource === "all"}
            onChange={() => setQuestionSource("all")}
          />
          <RadioOption
            id="mcq"
            name="question_source"
            label="Multiple Choice Only"
            description={`Practice ${questions.filter(q => q.type === "mcq").length} MCQ questions.`}
            checked={questionSource === "mcq"}
            onChange={() => setQuestionSource("mcq")}
          />
          <RadioOption
            id="saq"
            name="question_source"
            label="Short Answer Only"
            description={`Practice ${questions.filter(q => q.type === "saq").length} SAQ questions.`}
            checked={questionSource === "saq"}
            onChange={() => setQuestionSource("saq")}
          />
        </div>

        {/* Slider */}
        <Slider
          label="Number of Questions"
          value={Math.min(numberOfQuestions, maxQuestions)}
          min={1}
          max={maxQuestions}
          step={1}
          onChange={setNumberOfQuestions}
        />
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

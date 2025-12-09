"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Icon,
  SearchBar,
  Card,
  ProgressBar,
  FloatingActionButton,
  Button,
  ProtectedRoute,
  MasteryIndicator,
  TokenBalance,
  DailyBonusModal,
} from "../components";
import { useApp } from "../context/AppContext";
import { getConsensusPercent, getTopAnswer, getTotalVotes } from "../lib/utils";

function QuestionBankPageContent() {
  const router = useRouter();
  const { questions, currentUserName, user, getMasteryForQuestion, masteryStats } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "mcq" | "saq">("all");

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || q.type === filterType;
    return matchesSearch && matchesType;
  });

  const getConsensusColor = (percent: number) => {
    if (percent >= 70) return "success";
    if (percent >= 40) return "warning";
    return "error";
  };

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-background-light dark:bg-background-dark">
      {/* Daily Bonus Modal */}
      <DailyBonusModal />

      {/* Top App Bar */}
      <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
        <div className="flex items-center p-4 pb-2 justify-between">
          <h1 className="text-text-primary-light dark:text-text-primary-dark text-2xl font-bold leading-tight tracking-tight flex-1">
            Question Bank
          </h1>
          <div className="flex items-center gap-3">
            {/* Token Balance */}
            <TokenBalance compact showLabel={false} />
            {/* Streak Display */}
            <div className="flex items-center gap-1">
              <Icon name="local_fire_department" className="text-orange-500" />
              <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                {user?.stats?.streak ?? 0}
              </span>
            </div>
            {/* Profile Button */}
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors"
            >
              {currentUserName.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow pb-24">
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search questions..."
        />

        {/* Filter Tabs */}
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
          {(["all", "mcq", "saq"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                ${filterType === type
                  ? "bg-primary text-white"
                  : "bg-surface-light dark:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark border border-border-light dark:border-border-dark"
                }
              `}
            >
              {type === "all" ? "All" : type.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Question List */}
        {filteredQuestions.length > 0 && (
          <div className="flex flex-col gap-4 px-4">
            {filteredQuestions.map((q) => {
              const consensusPercent = getConsensusPercent(q);
              const topAnswer = getTopAnswer(q);
              const totalVotes = getTotalVotes(q);
              const mastery = getMasteryForQuestion(q.id);
              const masteryLevel = mastery?.masteryLevel ?? "new";

              return (
                <Card
                  key={q.id}
                  className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  onClick={() => router.push(`/questions/${q.id}`)}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-text-primary-light dark:text-text-primary-dark text-base font-bold leading-tight tracking-tight flex-1">
                        {q.question}
                      </p>
                      <MasteryIndicator level={masteryLevel} className="mt-0.5 flex-shrink-0" />
                    </div>

                    <p className="text-text-secondary-light dark:text-slate-400 text-sm font-normal leading-normal">
                      {totalVotes === 0
                        ? "No answers yet"
                        : `Top Answer: ${topAnswer.length > 80 ? topAnswer.substring(0, 80) + "..." : topAnswer}`}
                    </p>

                    <div className="flex items-center pt-2">
                      <ProgressBar
                        value={consensusPercent}
                        variant={getConsensusColor(consensusPercent) as "success" | "warning" | "error"}
                        showLabel
                        className="flex-1"
                      />
                    </div>

                    {/* Added by & Votes */}
                    <div className="flex items-center justify-between pt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      <div className="flex items-center gap-1.5">
                        <Icon name="person" size="sm" className="opacity-60" />
                        <span><span className="font-medium">{q.createdBy}</span></span>
                      </div>
                      <span>{totalVotes} votes</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Question Section */}
        <div className={`px-4 ${filteredQuestions.length > 0 ? "mt-8" : "mt-4"} mb-4`}>
          <Card variant="outlined" className="text-center py-6">
            <Icon name="add_circle" size="xl" className="text-primary mb-2" />
            <p className="text-text-primary-light dark:text-text-primary-dark font-medium mb-1">
              {questions.length === 0 ? "Be the first to add a question!" : "Have a question to add?"}
            </p>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
              {questions.length === 0 ? "Start building the question bank" : "Contribute to the question bank"}
            </p>
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={() => router.push("/add")}
              >
                <Icon name="add" size="sm" />
                Add Question
              </Button>
            </div>
          </Card>
        </div>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon="play_arrow"
        onClick={() => router.push("/practice/setup")}
      />
    </div>
  );
}

export default function QuestionBankPage() {
  return (
    <ProtectedRoute>
      <QuestionBankPageContent />
    </ProtectedRoute>
  );
}

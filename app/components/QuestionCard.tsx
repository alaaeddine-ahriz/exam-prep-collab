"use client";

import { Card } from "./Card";
import { ProgressBar } from "./ProgressBar";
import { Icon } from "./Icon";

export type QuestionStatus = "correct" | "incorrect" | "unattempted";

interface QuestionCardProps {
  question: string;
  topAnswer: string;
  consensusPercent: number;
  status: QuestionStatus;
  onClick?: () => void;
}

function getStatusIcon(status: QuestionStatus, consensusPercent: number) {
  switch (status) {
    case "correct":
      return <Icon name="check_circle" filled className="text-success" />;
    case "incorrect":
      return <Icon name="cancel" filled className="text-error" />;
    case "unattempted":
    default:
      return <Icon name="radio_button_unchecked" className="text-slate-400 dark:text-slate-500" />;
  }
}

export function QuestionCard({
  question,
  topAnswer,
  consensusPercent,
  status,
  onClick,
}: QuestionCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99] ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="flex flex-col items-stretch justify-start">
        <div className="flex w-full grow flex-col items-stretch justify-center gap-2">
          <p className="text-text-primary-light dark:text-text-primary-dark text-lg font-bold leading-tight tracking-tight">
            {question}
          </p>
          <p className="text-text-secondary-light dark:text-slate-400 text-sm font-normal leading-normal">
            Top Answer: {topAnswer}
          </p>
          <div className="flex items-center gap-3 justify-between pt-2">
            <ProgressBar
              value={consensusPercent}
              variant="auto"
              showLabel
              className="flex-1"
            />
            <div className="flex-shrink-0">
              {getStatusIcon(status, consensusPercent)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}


"use client";

import { QuestionType } from "../lib/services/types";

interface QuestionTypeBadgeProps {
  type: QuestionType;
  className?: string;
}

export function QuestionTypeBadge({ type, className = "" }: QuestionTypeBadgeProps) {
  const isMCQ = type === "mcq";
  
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide
        ${isMCQ
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
        }
        ${className}
      `}
    >
      {isMCQ ? "MCQ" : "SAQ"}
    </span>
  );
}


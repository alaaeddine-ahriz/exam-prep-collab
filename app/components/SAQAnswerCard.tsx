"use client";

import { Icon } from "./Icon";

interface SAQAnswerCardProps {
  answer: string;
  votes: number;
  percentage: number;
  createdBy: string;
  isTopAnswer?: boolean;
  isSelected?: boolean;
  isUserVote?: boolean;
  onVote?: () => void;
}

export function SAQAnswerCard({
  answer,
  votes,
  percentage,
  createdBy,
  isTopAnswer = false,
  isSelected = false,
  isUserVote = false,
  onVote,
}: SAQAnswerCardProps) {
  return (
    <div
      onClick={onVote}
      className={`
        rounded-xl border p-4 transition-all duration-200 cursor-pointer relative
        ${isTopAnswer
          ? "border-2 border-primary bg-primary/5 dark:bg-primary/10"
          : isUserVote
            ? "border-2 border-success bg-success/5 dark:bg-success/10"
            : "border-border-light dark:border-border-dark bg-surface-light dark:bg-slate-800/50"
        }
        ${isSelected && !isUserVote ? "ring-2 ring-primary/30" : ""}
        hover:shadow-md
      `}
    >
      {/* Your Vote Badge */}
      {isUserVote && (
        <span className="absolute -top-2 right-3 px-2 py-0.5 text-xs font-semibold bg-success text-white rounded-full">
          Your Vote
        </span>
      )}
      
      <p className="text-text-primary-light dark:text-text-primary-dark text-base leading-relaxed mb-3">
        {answer}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          <Icon name="person" size="sm" />
          <span>{createdBy}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm">
            <span className={`font-medium ${
              isUserVote 
                ? "text-success" 
                : isTopAnswer 
                  ? "text-primary" 
                  : "text-text-secondary-light dark:text-text-secondary-dark"
            }`}>
              {percentage}%
            </span>
            <span className="text-text-secondary-light dark:text-text-secondary-dark">
              ({votes} votes)
            </span>
          </div>
          
          <div
            className={`
              flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium
              transition-colors duration-200
              ${isSelected
                ? "bg-primary text-white"
                : isUserVote
                  ? "bg-success text-white"
                  : "bg-primary/10 text-primary"
              }
            `}
          >
            <Icon name={isUserVote ? "check" : "thumb_up"} size="sm" />
            <span>{isUserVote ? "Voted" : "Vote"}</span>
          </div>
        </div>
      </div>
      
      {isTopAnswer && (
        <div className="flex items-center gap-1 mt-2 text-sm text-primary">
          <Icon name="star" size="sm" filled />
          <span className="font-medium">Top Answer</span>
        </div>
      )}
    </div>
  );
}


"use client";

import { MasteryLevel } from "../lib/services/types";
import { Icon } from "./Icon";

interface MasteryBadgeProps {
  level: MasteryLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const MASTERY_CONFIG: Record<
  MasteryLevel,
  {
    label: string;
    icon: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  new: {
    label: "New",
    icon: "fiber_new",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    textColor: "text-slate-600 dark:text-slate-400",
    borderColor: "border-slate-300 dark:border-slate-600",
  },
  learning: {
    label: "Learning",
    icon: "school",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-300 dark:border-orange-600",
  },
  reviewing: {
    label: "Reviewing",
    icon: "autorenew",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-300 dark:border-blue-600",
  },
  mastered: {
    label: "Mastered",
    icon: "verified",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-300 dark:border-green-600",
  },
};

const SIZE_CONFIG = {
  sm: {
    padding: "px-1.5 py-0.5",
    text: "text-xs",
    iconSize: "sm" as const,
    gap: "gap-0.5",
  },
  md: {
    padding: "px-2 py-1",
    text: "text-sm",
    iconSize: "sm" as const,
    gap: "gap-1",
  },
  lg: {
    padding: "px-3 py-1.5",
    text: "text-base",
    iconSize: "md" as const,
    gap: "gap-1.5",
  },
};

export function MasteryBadge({
  level,
  size = "md",
  showLabel = true,
  className = "",
}: MasteryBadgeProps) {
  const config = MASTERY_CONFIG[level];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div
      className={`
        inline-flex items-center ${sizeConfig.gap} ${sizeConfig.padding}
        rounded-full border ${config.borderColor} ${config.bgColor}
        ${className}
      `}
    >
      <Icon
        name={config.icon}
        size={sizeConfig.iconSize}
        className={config.textColor}
      />
      {showLabel && (
        <span className={`${sizeConfig.text} font-medium ${config.textColor}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

// Compact version for lists - just shows an icon with tooltip-like behavior
interface MasteryIndicatorProps {
  level: MasteryLevel;
  className?: string;
}

export function MasteryIndicator({ level, className = "" }: MasteryIndicatorProps) {
  const config = MASTERY_CONFIG[level];

  return (
    <span title={config.label} className={className}>
      <Icon
        name={config.icon}
        size="sm"
        className={config.textColor}
      />
    </span>
  );
}

// Progress ring for mastery visualization
interface MasteryRingProps {
  masteredPercent: number;
  reviewingPercent: number;
  learningPercent: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function MasteryRing({
  masteredPercent,
  reviewingPercent,
  learningPercent,
  size = 120,
  strokeWidth = 12,
  className = "",
}: MasteryRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Normalize percentages (ensure they don't exceed 100 total)
  const total = masteredPercent + reviewingPercent + learningPercent;
  const normalizedMastered = total > 0 ? (masteredPercent / Math.max(total, 100)) * 100 : 0;
  const normalizedReviewing = total > 0 ? (reviewingPercent / Math.max(total, 100)) * 100 : 0;
  const normalizedLearning = total > 0 ? (learningPercent / Math.max(total, 100)) * 100 : 0;

  // Calculate cumulative offsets (each segment starts where the previous ends)
  // SVG stroke-dashoffset is measured from the top (3 o'clock position after -90deg rotation)
  const masteredStart = 0;
  const reviewingStart = normalizedMastered;
  const learningStart = normalizedMastered + normalizedReviewing;

  return (
    <svg
      width={size}
      height={size}
      className={`transform -rotate-90 ${className}`}
    >
      {/* Background ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-slate-200 dark:text-slate-700"
      />

      {/* Mastered segment (green) - draw first at the start */}
      {normalizedMastered > 0 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${(normalizedMastered / 100) * circumference} ${circumference}`}
          strokeDashoffset={-(masteredStart / 100) * circumference}
          className="text-green-500"
        />
      )}

      {/* Reviewing segment (blue) - draw after mastered */}
      {normalizedReviewing > 0 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${(normalizedReviewing / 100) * circumference} ${circumference}`}
          strokeDashoffset={-(reviewingStart / 100) * circumference}
          className="text-blue-500"
        />
      )}

      {/* Learning segment (orange) - draw last */}
      {normalizedLearning > 0 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${(normalizedLearning / 100) * circumference} ${circumference}`}
          strokeDashoffset={-(learningStart / 100) * circumference}
          className="text-orange-500"
        />
      )}
    </svg>
  );
}

export default MasteryBadge;

"use client";

interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const sizeClasses = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
  "2xl": "text-4xl",
};

export function Icon({ name, className = "", filled = false, size = "lg" }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "fill" : ""} ${sizeClasses[size]} ${className}`}
    >
      {name}
    </span>
  );
}


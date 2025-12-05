"use client";

import { Icon } from "./Icon";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-1 gap-3 rounded-lg border border-border-light dark:border-slate-700 bg-background-light dark:bg-background-dark p-4 flex-col">
      <Icon name={icon} className="text-text-primary-light dark:text-primary" />
      <div className="flex flex-col gap-1">
        <h2 className="text-text-primary-light dark:text-text-primary-dark text-base font-bold leading-tight">
          {title}
        </h2>
        <p className="text-text-secondary-light dark:text-slate-400 text-sm font-normal leading-normal">
          {description}
        </p>
      </div>
    </div>
  );
}


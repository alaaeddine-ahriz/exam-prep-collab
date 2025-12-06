"use client";

import { ReactNode, useEffect } from "react";
import { Icon } from "./Icon";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  allowOverflow?: boolean;
}

export function BottomSheet({ isOpen, onClose, title, children, allowOverflow = false }: BottomSheetProps) {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative flex flex-col w-full max-w-md rounded-t-xl bg-background-light dark:bg-background-dark shadow-2xl animate-slide-up">
        {/* Handle */}
        <div className="flex h-5 w-full items-center justify-center pt-3">
          <div className="h-1 w-9 rounded-full bg-border-light dark:bg-border-dark" />
        </div>

        {/* Header */}
        <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2">
          <div className="flex w-12 items-center justify-start">
            <button
              onClick={onClose}
              className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-text-primary-light dark:text-text-primary-dark transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <Icon name="close" />
            </button>
          </div>
          <h2 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">
            {title}
          </h2>
          <div className="w-12" />
        </div>

        {/* Content */}
        <div className={`flex flex-col max-h-[70dvh] ${allowOverflow ? 'overflow-visible' : 'overflow-y-auto'}`}>
          {children}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}


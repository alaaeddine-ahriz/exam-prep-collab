"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Icon } from "./Icon";

interface TokenToastContextType {
  showTokenToast: (amount: number, message?: string) => void;
}

const TokenToastContext = createContext<TokenToastContextType | null>(null);

export function useTokenToast() {
  const context = useContext(TokenToastContext);
  if (!context) {
    throw new Error("useTokenToast must be used within a TokenToastProvider");
  }
  return context;
}

interface ToastData {
  id: number;
  amount: number;
  message?: string;
}

export function TokenToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showTokenToast = useCallback((amount: number, message?: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, amount, message }]);

    // Auto-remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  return (
    <TokenToastContext.Provider value={{ showTokenToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none flex flex-col items-center pt-4 gap-2">
        {toasts.map((toast) => (
          <TokenToastItem key={toast.id} amount={toast.amount} message={toast.message} />
        ))}
      </div>
    </TokenToastContext.Provider>
  );
}

function TokenToastItem({ amount, message }: { amount: number; message?: string }) {
  const isPositive = amount > 0;

  return (
    <div
      className={`
        flex items-center gap-2 px-4 py-3 rounded-full shadow-lg
        animate-token-toast pointer-events-auto
        ${isPositive 
          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white" 
          : "bg-gradient-to-r from-red-500 to-red-600 text-white"
        }
      `}
    >
      <div className={`
        flex items-center justify-center w-8 h-8 rounded-full
        ${isPositive ? "bg-amber-400/30" : "bg-red-400/30"}
      `}>
        <Icon 
          name={isPositive ? "toll" : "remove_circle"} 
          size="sm" 
          className="text-white"
        />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-tight">
          {isPositive ? "+" : ""}{amount} Tokens
        </span>
        {message && (
          <span className="text-xs text-white/80 leading-tight">
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

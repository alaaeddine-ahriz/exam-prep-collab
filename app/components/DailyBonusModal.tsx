"use client";

import { useState, useEffect } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { useApp } from "../context/AppContext";

export function DailyBonusModal() {
  const { currencyInfo, claimDailyBonus } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<{ success: boolean; amount?: number } | null>(null);

  // Show modal if daily bonus is available
  useEffect(() => {
    if (currencyInfo?.canClaimDailyBonus && !claimResult) {
      // Small delay to avoid showing immediately on page load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (currencyInfo && !currencyInfo.canClaimDailyBonus && !claimResult) {
      // Close modal if bonus is no longer available (already claimed)
      setIsOpen(false);
    }
  }, [currencyInfo?.canClaimDailyBonus, claimResult]);

  const handleClaim = async () => {
    setIsClaiming(true);
    const result = await claimDailyBonus();
    setClaimResult(result);
    setIsClaiming(false);
    
    if (result.success) {
      // Close after a brief moment to show success
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    } else {
      // Already claimed - close the modal
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen || !currencyInfo) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
            <Icon name="toll" className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {claimResult?.success ? "Bonus Claimed!" : "Daily Bonus"}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {claimResult?.success ? (
            <>
              <div className="text-4xl font-bold text-amber-500 mb-2">
                +{claimResult.amount}
              </div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                {currencyInfo.config.currencyName} added to your balance!
              </p>
            </>
          ) : (
            <>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
                Claim your daily login bonus!
              </p>
              <div className="text-4xl font-bold text-amber-500 mb-2">
                +{currencyInfo.config.dailyLoginReward}
              </div>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {currencyInfo.config.currencyName}
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border-light dark:border-border-dark flex gap-3">
          {claimResult?.success ? (
            <Button
              variant="primary"
              fullWidth
              onClick={handleClose}
            >
              Awesome!
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                fullWidth
                onClick={handleClose}
              >
                Later
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleClaim}
                disabled={isClaiming}
              >
                {isClaiming ? "Claiming..." : "Claim Now"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


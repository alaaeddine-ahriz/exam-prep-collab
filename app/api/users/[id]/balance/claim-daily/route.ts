import { NextRequest, NextResponse } from "next/server";
import { claimDailyBonus, getCurrencyConfig } from "@/app/lib/services/currencyService";

/**
 * POST /api/users/[id]/balance/claim-daily
 * Claim daily login bonus
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await claimDailyBonus(id);
    const config = getCurrencyConfig();

    if (!result.success) {
      return NextResponse.json(
        { 
          error: "Daily bonus already claimed",
          balance: result.balance.balance,
        },
        { status: 409 } // Conflict - already claimed
      );
    }

    return NextResponse.json({
      success: true,
      amount: config.rewards.dailyLogin,
      newBalance: result.balance.balance,
    });
  } catch (error) {
    console.error("Error claiming daily bonus:", error);
    return NextResponse.json(
      { error: "Failed to claim daily bonus" },
      { status: 500 }
    );
  }
}


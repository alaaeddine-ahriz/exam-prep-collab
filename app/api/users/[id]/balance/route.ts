import { NextRequest, NextResponse } from "next/server";
import {
  getBalance,
  getPracticeSessionInfo,
  spendTokens,
  getCurrencyConfig,
} from "@/app/lib/services/currencyService";
import { TransactionType } from "@/app/lib/services/types";
import { env } from "@/app/lib/config/env";

/**
 * GET /api/users/[id]/balance
 * Get user's token balance and practice session info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Don't create records for "local-user" in production with Supabase
    if (id === "local-user" && env.dataProvider === "supabase") {
      const config = getCurrencyConfig();
      return NextResponse.json({
        balance: 0,
        canClaimDailyBonus: false,
        practiceSessionsUsedToday: 0,
        freeSessionsRemaining: config.limits.freePracticeSessionsPerDay,
        requiresPaymentForPractice: false,
        config: {
          currencyName: config.currency.name,
          practiceSessionCost: config.costs.practiceSession,
          aiVerificationCost: config.costs.aiVerification,
          aiExplanationCost: config.costs.aiExplanation,
          dailyLoginReward: config.rewards.dailyLogin,
          voteReward: config.rewards.castVote,
          answerReward: config.rewards.submitAnswer,
          freePracticeSessionsPerDay: config.limits.freePracticeSessionsPerDay,
        },
      });
    }
    
    const [balance, practiceInfo] = await Promise.all([
      getBalance(id),
      getPracticeSessionInfo(id),
    ]);

    const config = getCurrencyConfig();

    return NextResponse.json({
      balance: balance.balance,
      canClaimDailyBonus: balance.canClaimDailyBonus,
      practiceSessionsUsedToday: practiceInfo.usedToday,
      freeSessionsRemaining: practiceInfo.freeRemaining,
      requiresPaymentForPractice: practiceInfo.requiresPayment,
      config: {
        currencyName: config.currency.name,
        practiceSessionCost: config.costs.practiceSession,
        aiVerificationCost: config.costs.aiVerification,
        aiExplanationCost: config.costs.aiExplanation,
        dailyLoginReward: config.rewards.dailyLogin,
        voteReward: config.rewards.castVote,
        answerReward: config.rewards.submitAnswer,
        freePracticeSessionsPerDay: config.limits.freePracticeSessionsPerDay,
      },
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/[id]/balance
 * Spend tokens for a specific action
 * Body: { type: "practice" | "ai_verify" | "ai_explain", amount?: number }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type } = body as { type: TransactionType };

    const config = getCurrencyConfig();
    let amount: number;
    let description: string;

    switch (type) {
      case "practice":
        amount = config.costs.practiceSession;
        description = "Extra practice session";
        break;
      case "ai_verify":
        amount = config.costs.aiVerification;
        description = "AI answer verification";
        break;
      case "ai_explain":
        amount = config.costs.aiExplanation;
        description = "AI answer explanation";
        break;
      default:
        return NextResponse.json(
          { error: "Invalid transaction type" },
          { status: 400 }
        );
    }

    const result = await spendTokens(id, amount, type, description);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: "Insufficient balance",
          balance: result.balance.balance,
          required: amount,
        },
        { status: 402 } // Payment Required
      );
    }

    return NextResponse.json({
      success: true,
      newBalance: result.balance.balance,
    });
  } catch (error) {
    console.error("Error spending tokens:", error);
    return NextResponse.json(
      { error: "Failed to spend tokens" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getUserRules } from "@/lib/learner/learnerStore";
import { buildInjection } from "@/lib/learner/buildInjection";
import type { InteractionContext } from "@/lib/learner/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const context = (searchParams.get("context") || "general") as InteractionContext;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const rules = getUserRules(userId);
    const injection = buildInjection(rules, context);

    return NextResponse.json({
      injection,
      rules,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to build preferences" },
      { status: 500 }
    );
  }
}

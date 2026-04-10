import { NextRequest, NextResponse } from "next/server";
import { detectLengthSignal } from "@/lib/learner/detectors/length";
import { detectToneSignal } from "@/lib/learner/detectors/tone";
import { detectNextStepSignal } from "@/lib/learner/detectors/nextStep";
import { detectHedgingSignal } from "@/lib/learner/detectors/hedging";
import { updateRules } from "@/lib/learner/updateRules";
import { computeMagnitude } from "@/lib/learner/utils";
import { logMetrics } from "@/lib/learner/metricsStore";
import type { InteractionEvent, Signal } from "@/lib/learner/types";

export async function POST(request: NextRequest) {
  try {
    const event = (await request.json()) as InteractionEvent;

    if (!event?.userId || !event?.context || !event?.modelOutput || !event?.timestamp) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const signals: Signal[] = [
      detectLengthSignal(event),
      detectToneSignal(event),
      detectNextStepSignal(event),
      detectHedgingSignal(event),
    ].filter(Boolean) as Signal[];

    for (const signal of signals) {
      updateRules(event.userId, signal);
    }

    logMetrics({
      userId: event.userId,
      mode: event.mode || "baseline",
      hasCorrection: Boolean(event.userEdit && event.userEdit !== event.modelOutput),
      magnitude: computeMagnitude(event.modelOutput, event.userEdit),
      timestamp: event.timestamp,
    });

    return NextResponse.json({
      status: "ok",
      signals,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process event" },
      { status: 500 }
    );
  }
}

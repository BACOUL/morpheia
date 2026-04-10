import { NextRequest, NextResponse } from "next/server";
import { getUserMetrics } from "@/lib/learner/metricsStore";

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const entries = getUserMetrics(userId);

    const baseline = entries.filter((entry) => entry.mode === "baseline");
    const learner = entries.filter((entry) => entry.mode === "learner");

    return NextResponse.json({
      userId,
      baseline: {
        correctionRate: baseline.length
          ? baseline.filter((entry) => entry.hasCorrection).length / baseline.length
          : 0,
        avgMagnitude: average(baseline.map((entry) => entry.magnitude)),
      },
      learner: {
        correctionRate: learner.length
          ? learner.filter((entry) => entry.hasCorrection).length / learner.length
          : 0,
        avgMagnitude: average(learner.map((entry) => entry.magnitude)),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load metrics" },
      { status: 500 }
    );
  }
}

import { computeConfidence } from "./utils";
import { getUserRules, saveUserRules } from "./learnerStore";
import type { Rule, RuleDimension, RuleValue, Signal } from "./types";

function mapSignalToRule(signal: Signal): { dimension: RuleDimension; value: RuleValue } | null {
  switch (signal.signalType) {
    case "length":
      return signal.direction === "shorter"
        ? { dimension: "length", value: "short" }
        : signal.direction === "longer"
        ? { dimension: "length", value: "long" }
        : null;

    case "tone":
      return signal.direction === "more_direct"
        ? { dimension: "tone", value: "more_direct" }
        : signal.direction === "more_polite"
        ? { dimension: "tone", value: "more_polite" }
        : null;

    case "next_step":
      return signal.direction === "prefer_next_step"
        ? { dimension: "next_step", value: "prefer_next_step" }
        : signal.direction === "avoid_next_step"
        ? { dimension: "next_step", value: "avoid_next_step" }
        : null;

    case "hedging":
      return signal.direction === "less_hedging"
        ? { dimension: "hedging", value: "less_hedging" }
        : signal.direction === "more_hedging"
        ? { dimension: "hedging", value: "more_hedging" }
        : null;

    default:
      return null;
  }
}

export function updateRules(userId: string, signal: Signal) {
  const mapped = mapSignalToRule(signal);
  if (!mapped) return;

  const rules = getUserRules(userId);
  const ruleId = `${mapped.dimension}_${mapped.value}_v1`;

  const existing = rules.find((rule) => rule.ruleId === ruleId);

  if (existing) {
    existing.evidence.positive += signal.score > 0 ? 1 : 0;
    existing.evidence.lastEvent = signal.timestamp;
    existing.confidence = computeConfidence(
      existing.evidence.positive,
      existing.evidence.negative
    );
  } else {
    const newRule: Rule = {
      userId,
      ruleId,
      dimension: mapped.dimension,
      value: mapped.value,
      confidence: computeConfidence(1, 0),
      evidence: {
        positive: 1,
        negative: 0,
        lastEvent: signal.timestamp,
      },
      activationContexts: ["email_reply", "task_generation", "general"],
    };

    rules.push(newRule);
  }

  saveUserRules(userId, rules);
}

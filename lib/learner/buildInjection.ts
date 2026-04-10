import type { InteractionContext, Rule } from "./types";

const PRIORITY: Record<string, number> = {
  length: 1,
  tone: 2,
  hedging: 3,
  next_step: 4,
};

function ruleToInstruction(rule: Rule, context: InteractionContext): string | null {
  switch (rule.dimension) {
    case "length":
      if (rule.value === "short") return "Be concise.";
      if (rule.value === "long") return "Provide more detail when helpful.";
      return null;

    case "tone":
      if (rule.value === "more_direct") return "Use a direct and efficient tone.";
      if (rule.value === "more_polite") return "Use a polite and professional tone.";
      return null;

    case "hedging":
      if (rule.value === "less_hedging") return "Avoid unnecessary hedging.";
      if (rule.value === "more_hedging") return "Use careful, nuanced language when appropriate.";
      return null;

    case "next_step":
      if (rule.value === "prefer_next_step") {
        return context === "explanation"
          ? "Only include a next step if action is clearly relevant."
          : "Include a clear next step when relevant.";
      }
      if (rule.value === "avoid_next_step") return "Do not force a next step unless explicitly needed.";
      return null;

    default:
      return null;
  }
}

export function buildInjection(rules: Rule[], context: InteractionContext): string {
  const activeRules = rules
    .filter((rule) => rule.confidence > 0.65)
    .filter((rule) => rule.activationContexts.includes(context))
    .sort((a, b) => PRIORITY[a.dimension] - PRIORITY[b.dimension])
    .slice(0, 4);

  const instructions = activeRules
    .map((rule) => ruleToInstruction(rule, context))
    .filter(Boolean) as string[];

  if (!instructions.length) {
    return "";
  }

  return [
    "Adapt your response to match these user preferences:",
    ...instructions.map((instruction) => `- ${instruction}`),
    "",
    "Adjust based on the task. Do not apply rules blindly.",
  ].join("\n");
}

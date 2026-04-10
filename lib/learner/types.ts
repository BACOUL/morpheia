export type InteractionContext =
  | "email_reply"
  | "task_generation"
  | "explanation"
  | "general";

export type UserChoice = "short" | "medium" | "long" | "polite" | "neutral" | "direct" | "with_action" | "without_action" | "careful" | "assertive" | null;

export type InteractionEvent = {
  userId: string;
  context: InteractionContext;
  modelOutput: string;
  userEdit?: string | null;
  userInstruction?: string | null;
  userChoice?: UserChoice;
  timestamp: string;
  mode?: "baseline" | "learner";
};

export type SignalType = "length" | "tone" | "next_step" | "hedging";

export type SignalDirection =
  | "shorter"
  | "longer"
  | "more_direct"
  | "more_polite"
  | "prefer_next_step"
  | "avoid_next_step"
  | "less_hedging"
  | "more_hedging"
  | "neutral";

export type SignalStrength = "weak" | "strong";

export type Signal = {
  userId: string;
  signalType: SignalType;
  direction: SignalDirection;
  score: number;
  strength: SignalStrength;
  evidence: Record<string, unknown>;
  timestamp: string;
};

export type RuleDimension = "length" | "tone" | "next_step" | "hedging";

export type RuleValue =
  | "short"
  | "long"
  | "more_direct"
  | "more_polite"
  | "prefer_next_step"
  | "avoid_next_step"
  | "less_hedging"
  | "more_hedging";

export type Rule = {
  userId: string;
  ruleId: string;
  dimension: RuleDimension;
  value: RuleValue;
  confidence: number;
  evidence: {
    positive: number;
    negative: number;
    lastEvent: string;
  };
  activationContexts: InteractionContext[];
};

export type MetricsEntry = {
  userId: string;
  mode: "baseline" | "learner";
  hasCorrection: boolean;
  magnitude: number;
  timestamp: string;
};

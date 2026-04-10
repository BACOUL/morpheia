import type { InteractionEvent, Signal } from "../types";
import { includesAny, safeLower } from "../utils";

const HEDGING_PATTERNS = [
  "peut-être",
  "peut etre",
  "probablement",
  "il semble",
  "il est possible",
  "potentiellement",
  "on dirait",
  "je pense que",
  "il se pourrait",
];

const LESS_HEDGING_PATTERNS = [
  "plus affirmé",
  "plus affirme",
  "moins de peut-être",
  "moins de peut etre",
  "pas de hedging",
  "réponse claire",
  "reponse claire",
  "arrête les nuances",
  "arrete les nuances",
  "sois direct dans la certitude",
];

const MORE_HEDGING_PATTERNS = [
  "sois prudent",
  "nuance davantage",
  "ne sois pas catégorique",
  "ne sois pas categorique",
  "évite les affirmations",
  "evite les affirmations",
];

export function detectHedgingSignal(event: InteractionEvent): Signal | null {
  const modelText = safeLower(event.modelOutput);
  const userText = safeLower(event.userEdit);
  const instruction = safeLower(event.userInstruction);

  const removedHedging = HEDGING_PATTERNS.filter(
    (item) => modelText.includes(item) && !userText.includes(item)
  );

  const addedHedging = HEDGING_PATTERNS.filter(
    (item) => !modelText.includes(item) && userText.includes(item)
  );

  const lessMatches = includesAny(instruction, LESS_HEDGING_PATTERNS);
  const moreMatches = includesAny(instruction, MORE_HEDGING_PATTERNS);

  let direction: Signal["direction"] = "neutral";
  let score = 0;
  let strength: Signal["strength"] = "weak";

  if (removedHedging.length >= 1) {
    direction = "less_hedging";
    score += 1;
  }

  if (removedHedging.length >= 2) {
    direction = "less_hedging";
    score += 1;
    strength = "strong";
  }

  if (lessMatches.length > 0) {
    direction = "less_hedging";
    score += 2;
    strength = "strong";
  }

  if (addedHedging.length >= 1) {
    direction = "more_hedging";
    score += 1;
  }

  if (moreMatches.length > 0) {
    direction = "more_hedging";
    score += 2;
    strength = "strong";
  }

  if (event.userChoice === "assertive") {
    direction = "less_hedging";
    score += 1;
  }

  if (event.userChoice === "careful") {
    direction = "more_hedging";
    score += 1;
  }

  if (score <= 0 || direction === "neutral") {
    return null;
  }

  return {
    userId: event.userId,
    signalType: "hedging",
    direction,
    score,
    strength,
    evidence: {
      removedHedging,
      addedHedging,
      lessMatches,
      moreMatches,
      choice: event.userChoice || null,
    },
    timestamp: event.timestamp,
  };
}
